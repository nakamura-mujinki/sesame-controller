import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { cbc } from "https://esm.sh/@noble/ciphers@1.0.0/aes";

const SESAME_API_BASE = "https://app.candyhouse.co/api/sesame2";

// AES-CMAC using @noble/ciphers
function generateSign(secret: string, timestamp: number): string {
  const secretBytes = hexToBytes(secret);

  // タイムスタンプをリトルエンディアン4バイトにして、[1:4]を抽出（Pythonと同じ）
  const fullTimestamp = new Uint8Array(4);
  new DataView(fullTimestamp.buffer).setUint32(0, timestamp, true);
  const message = fullTimestamp.slice(1, 4);  // 3バイトのみ使用

  // AES-CMAC implementation
  const cmac = aesCmac(secretBytes, message);
  return bytesToHex(cmac);
}

// AES-CMAC (RFC 4493) implementation
function aesCmac(key: Uint8Array, message: Uint8Array): Uint8Array {
  const zeroBlock = new Uint8Array(16);

  // Step 1: Generate subkeys
  const cipher = cbc(key, zeroBlock);
  const L = cipher.encrypt(zeroBlock);
  const K1 = generateSubkey(L);
  const K2 = generateSubkey(K1);

  // Step 2: Determine if message needs padding
  const blockSize = 16;
  const numBlocks = message.length === 0 ? 1 : Math.ceil(message.length / blockSize);
  const lastBlockComplete = message.length > 0 && message.length % blockSize === 0;

  // Step 3: Prepare the last block
  const lastBlock = new Uint8Array(blockSize);
  const lastBlockStart = (numBlocks - 1) * blockSize;
  const lastBlockLen = message.length - lastBlockStart;

  if (lastBlockComplete) {
    // Complete block: XOR with K1
    for (let i = 0; i < blockSize; i++) {
      lastBlock[i] = message[lastBlockStart + i] ^ K1[i];
    }
  } else {
    // Incomplete block: pad and XOR with K2
    for (let i = 0; i < lastBlockLen; i++) {
      lastBlock[i] = message[lastBlockStart + i];
    }
    lastBlock[lastBlockLen] = 0x80; // Padding
    for (let i = 0; i < blockSize; i++) {
      lastBlock[i] ^= K2[i];
    }
  }

  // Step 4: CBC-MAC
  let X = new Uint8Array(blockSize);

  // Process all blocks except the last one
  for (let i = 0; i < numBlocks - 1; i++) {
    const block = message.slice(i * blockSize, (i + 1) * blockSize);
    const Y = new Uint8Array(blockSize);
    for (let j = 0; j < blockSize; j++) {
      Y[j] = X[j] ^ block[j];
    }
    const encCipher = cbc(key, zeroBlock);
    X = encCipher.encrypt(Y).slice(0, blockSize);
  }

  // Process the last block
  const Y = new Uint8Array(blockSize);
  for (let j = 0; j < blockSize; j++) {
    Y[j] = X[j] ^ lastBlock[j];
  }
  const finalCipher = cbc(key, zeroBlock);
  return finalCipher.encrypt(Y).slice(0, blockSize);
}

function generateSubkey(L: Uint8Array): Uint8Array {
  const K = new Uint8Array(16);
  let carry = 0;

  for (let i = 15; i >= 0; i--) {
    const tmp = (L[i] << 1) | carry;
    K[i] = tmp & 0xff;
    carry = (L[i] & 0x80) ? 1 : 0;
  }

  if (L[0] & 0x80) {
    K[15] ^= 0x87;
  }

  return K;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // 認証チェック
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const fallbackApiKey = Deno.env.get("SESAME_API_KEY"); // Fallback if user has no key

    // ユーザー認証
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // リクエストボディ
    const { device_uuid, action } = await req.json();

    if (!device_uuid || !action) {
      return new Response(
        JSON.stringify({ error: "device_uuid and action are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // デバイス情報取得（Service Role使用）
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // ユーザーのAPI Key取得
    const { data: userSettings } = await supabaseService
      .from("user_settings")
      .select("sesame_api_key")
      .eq("user_id", user.id)
      .single();

    const sesameApiKey = userSettings?.sesame_api_key || fallbackApiKey;

    if (!sesameApiKey) {
      return new Response(
        JSON.stringify({ error: "SESAME API Key not configured. Please set it in Settings." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { data: device, error: deviceError } = await supabaseService
      .from("devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_uuid", device_uuid)
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: "Device not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // コマンドコード決定
    const isBotType = device.device_type === "bot2";

    let cmd: number;
    if (isBotType) {
      // Bot2: scenario0=82, scenario1=83
      if (action === "scenario0") cmd = 82;
      else if (action === "scenario1") cmd = 83;
      else cmd = 82;
    } else {
      // Lock types
      if (action === "lock") cmd = 82;
      else if (action === "unlock") cmd = 83;
      else cmd = 82;
    }

    // Sesame APIコール
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = await generateSign(device.secret_key, timestamp);

    // Bot2はhistoryにシナリオ番号を入れる
    let historyLabel: string;
    if (isBotType) {
      if (action === "scenario0") historyLabel = "0";
      else if (action === "scenario1") historyLabel = "1";
      else historyLabel = "0";
    } else {
      historyLabel = "App";
    }

    const requestBody = {
      cmd,
      history: btoa(historyLabel),
      sign,
    };

    console.log("SESAME API Request:", {
      url: `${SESAME_API_BASE}/${device_uuid}/cmd`,
      cmd,
      action,
      timestamp,
      secretKeyLength: device.secret_key?.length,
      sign,
    });

    const response = await fetch(`${SESAME_API_BASE}/${device_uuid}/cmd`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": sesameApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log("SESAME API Response:", response.status, responseText);

    const success = response.ok;
    const message = success
      ? "Command executed successfully"
      : `API Error: ${response.status} - ${responseText}`;

    // ログ記録
    await supabaseService.from("operation_logs").insert({
      user_id: user.id,
      device_type: device.device_type,
      device_uuid: device_uuid,
      action,
      status: success ? "success" : "error",
      message,
    });

    return new Response(
      JSON.stringify({
        success,
        message,
        debug: {
          cmd,
          action,
          sesameApiStatus: response.status,
          sesameApiResponse: responseText,
          secretKeyLength: device.secret_key?.length,
          sign,
          timestamp,
        }
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
