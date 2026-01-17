import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SESAME_API_BASE = "https://app.candyhouse.co/api/sesame2";

// AES-CMAC実装（簡易版 - Web Crypto API使用）
async function generateSign(secret: string, timestamp: number): Promise<string> {
  const secretBytes = hexToBytes(secret);
  const timestampBytes = new Uint8Array(4);
  new DataView(timestampBytes.buffer).setUint32(0, timestamp, true);

  // AES-CMAC署名生成
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes,
    { name: "AES-CBC", length: 128 },
    false,
    ["encrypt"]
  );

  // K1サブキー生成
  const zeroBlock = new Uint8Array(16);
  const L = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-CBC", iv: zeroBlock },
      key,
      zeroBlock
    )
  ).slice(0, 16);

  const K1 = generateSubkey(L);

  // メッセージパディングとXOR
  const padded = new Uint8Array(16);
  padded.set(timestampBytes);
  padded[4] = 0x80;

  for (let i = 0; i < 16; i++) {
    padded[i] ^= K1[i];
  }

  // 最終暗号化
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

// Sesame APIコマンド送信
async function sendSesameCommand(
  deviceUuid: string,
  secretKey: string,
  cmd: number,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = await generateSign(secretKey, timestamp);

  const response = await fetch(`${SESAME_API_BASE}/${deviceUuid}/cmd`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      cmd,
      history: btoa("Schedule"),
      sign,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { success: false, message: `API Error: ${response.status} - ${error}` };
  }

  return { success: true, message: "Command executed successfully" };
}

// コマンドマッピング
function getCommandCode(deviceType: string, action: string): number {
  if (deviceType === "bot") {
    // Bot: 1=click, 2=scenario1(off), 3=scenario2(on)
    if (action === "scenario1" || action === "off") return 2;
    if (action === "scenario2" || action === "on") return 3;
    return 1; // default click
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
        sesameApiKey
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
