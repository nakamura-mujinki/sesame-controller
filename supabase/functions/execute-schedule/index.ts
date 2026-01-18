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

// Sesame APIコマンド送信
function sendSesameCommand(
  deviceUuid: string,
  secretKey: string,
  cmd: number,
  apiKey: string,
  deviceType: string,
  action: string
): Promise<{ success: boolean; message: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(secretKey, timestamp);

  // Bot2はhistoryにシナリオ番号を入れる
  let historyLabel: string;
  if (deviceType === "bot2") {
    if (action === "scenario0") historyLabel = "0";
    else if (action === "scenario1") historyLabel = "1";
    else historyLabel = "0";
  } else {
    historyLabel = "Schedule";
  }

  return fetch(`${SESAME_API_BASE}/${deviceUuid}/cmd`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      cmd,
      history: btoa(historyLabel),
      sign,
    }),
  }).then(async (response) => {
    if (!response.ok) {
      const error = await response.text();
      return { success: false, message: `API Error: ${response.status} - ${error}` };
    }
    return { success: true, message: "Command executed successfully" };
  });
}

// コマンドマッピング
function getCommandCode(deviceType: string, action: string): number {
  if (deviceType === "bot2") {
    // Bot2: scenario0=82, scenario1=83
    if (action === "scenario0") return 82;
    if (action === "scenario1") return 83;
    return 82; // default scenario0
  } else {
    // Lock: 82=lock, 83=unlock
    if (action === "lock") return 82;
    if (action === "unlock") return 83;
    return 82;
  }
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sesameApiKey = Deno.env.get("SESAME_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 現在時刻（JST = UTC+9）
    const now = new Date();
    const jstHour = (now.getUTCHours() + 9) % 24;
    const jstMinute = now.getUTCMinutes();

    // 現在の曜日を取得（JST）
    const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const jstDayOfWeek = jstDate.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday

    // 実行すべきスケジュールを取得
    const { data: schedules, error: scheduleError } = await supabase
      .from("schedules")
      .select(`
        id,
        user_id,
        name,
        device_type,
        device_uuid,
        action,
        time_hour,
        time_minute,
        days_of_week
      `)
      .eq("enabled", true)
      .eq("time_hour", jstHour)
      .eq("time_minute", jstMinute);

    if (scheduleError) {
      throw new Error(`Schedule fetch error: ${scheduleError.message}`);
    }

    const results = [];

    for (const schedule of schedules || []) {
      // 曜日フィルタ: days_of_weekがnullまたは空配列なら毎日、それ以外は該当曜日のみ
      const daysOfWeek = schedule.days_of_week as number[] | null;
      if (daysOfWeek && daysOfWeek.length > 0 && !daysOfWeek.includes(jstDayOfWeek)) {
        continue; // 今日は実行対象外
      }

      // デバイス情報取得
      const { data: device, error: deviceError } = await supabase
        .from("devices")
        .select("secret_key")
        .eq("user_id", schedule.user_id)
        .eq("device_uuid", schedule.device_uuid)
        .single();

      if (deviceError || !device) {
        results.push({
          schedule_id: schedule.id,
          success: false,
          message: "Device not found",
        });
        continue;
      }

      // コマンド実行
      const cmd = getCommandCode(schedule.device_type, schedule.action);
      const result = await sendSesameCommand(
        schedule.device_uuid,
        device.secret_key,
        cmd,
        sesameApiKey,
        schedule.device_type,
        schedule.action
      );

      // ログ記録
      await supabase.from("operation_logs").insert({
        user_id: schedule.user_id,
        device_type: schedule.device_type,
        device_uuid: schedule.device_uuid,
        action: schedule.action,
        status: result.success ? "success" : "error",
        message: `[Schedule: ${schedule.name}] ${result.message}`,
      });

      // last_executed_at更新
      await supabase
        .from("schedules")
        .update({ last_executed_at: new Date().toISOString() })
        .eq("id", schedule.id);

      results.push({
        schedule_id: schedule.id,
        schedule_name: schedule.name,
        ...result,
      });
    }

    return new Response(
      JSON.stringify({
        executed_at: now.toISOString(),
        jst_time: `${jstHour}:${jstMinute.toString().padStart(2, "0")}`,
        schedules_processed: results.length,
        results,
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
