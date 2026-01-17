import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SESAME_API_BASE = "https://app.candyhouse.co/api/sesame2";

// AES-CMAC実装
async function generateSign(secret: string, timestamp: number): Promise<string> {
  const secretBytes = hexToBytes(secret);
  const timestampBytes = new Uint8Array(4);
  new DataView(timestampBytes.buffer).setUint32(0, timestamp, true);

  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "AES-CBC", length: 128 },
    false,
    ["encrypt"]
  );

  const zeroBlock = new Uint8Array(16);
  const L = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: zeroBlock },
      key,
      zeroBlock
    )
  ).slice(0, 16);

  const K1 = generateSubkey(L);

  const padded = new Uint8Array(16);
  padded.set(timestampBytes);
  padded[4] = 0x80;

  for (let i = 0; i < 16; i++) {
    padded[i] ^= K1[i];
  }

  const cmac = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: zeroBlock },
      key,
      padded
    )
  ).slice(0, 16);

  return bytesToHex(cmac);
}

function generateSubkey(L: Uint8Array): Uint8Array {
  const K1 = new Uint8Array(16);
  let carry = 0;

  for (let i = 15; i >= 0; i--) {
    const tmp = (L[i] << 1) | carry;
    K1[i] = tmp & 0xff;
    carry = (L[i] & 0x80) ? 1 : 0;
  }

  if (L[0] & 0x80) {
    K1[15] ^= 0x87;
  }

  return K1;
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
    let cmd: number;
    if (device.device_type === "bot") {
      if (action === "scenario1" || action === "off") cmd = 2;
      else if (action === "scenario2" || action === "on") cmd = 3;
      else cmd = 1;
    } else {
      if (action === "lock") cmd = 82;
      else if (action === "unlock") cmd = 83;
      else cmd = 82;
    }

    // Sesame APIコール
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = await generateSign(device.secret_key, timestamp);

    const response = await fetch(`${SESAME_API_BASE}/${device_uuid}/cmd`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": sesameApiKey,
      },
      body: JSON.stringify({
        cmd,
        history: btoa("App"),
        sign,
      }),
    });

    const success = response.ok;
    const message = success
      ? "Command executed successfully"
      : `API Error: ${response.status}`;

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
      JSON.stringify({ success, message }),
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
