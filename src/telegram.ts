declare const __BOT_TOKEN__: string;

declare const __CHAT_ID__: string;
const CHAT_ID = __CHAT_ID__;

export function sendTelegram(text: string): void {
  const url = `https://api.telegram.org/bot${__BOT_TOKEN__}/sendMessage`;
  const res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    muteHttpExceptions: true,
    payload: JSON.stringify({ chat_id: CHAT_ID, text }),
  });

  const code = res.getResponseCode();
  const body = res.getContentText();
  Logger.log("Telegram %s: %s", code, body);
  if (code !== 200) {
    throw new Error(`Telegram ${code}: ${body}`);
  }
}