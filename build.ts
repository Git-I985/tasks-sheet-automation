import { $ } from "bun";

const OUT_DIR = "dist";
const token = process.env.TELEGRAM_BOT_TOKEN ?? "";
const chatId = process.env.TELEGRAM_CHAT_ID ?? "";

if (!token) console.warn("⚠ TELEGRAM_BOT_TOKEN пуст в .env — sendTelegram работать не будет");
if (!chatId) console.warn("⚠ TELEGRAM_CHAT_ID пуст в .env — sendTelegram работать не будет");

await $`rm -rf ${OUT_DIR}`;
await $`mkdir -p ${OUT_DIR}`;

await $`esbuild src/main.ts --bundle --format=esm --target=es2019 --define:__BOT_TOKEN__=${JSON.stringify(token)} --define:__CHAT_ID__=${JSON.stringify(chatId)} --outfile=${OUT_DIR}/Code.gs`;

await Bun.write(`${OUT_DIR}/appsscript.json`, Bun.file("appsscript.json"));

console.log(`✔ build → ${OUT_DIR}/Code.gs`);