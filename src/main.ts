import { fileConfig } from "./config";
import { sendTelegram } from "./telegram";

function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void {
  const sh = e ? e.source.getActiveSheet() : SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const name = sh.getName();

  for (const def of fileConfig.sheets) {
    if (def.onEdit && def.name === name) {
      def.onEdit(e);
    }
  }
}

function applyFormatting(): void {
  for (const def of fileConfig.sheets) {
    if (def.formats.length) def.applyFormatting();
  }
}

function onOpen(): void {
  applyFormatting();
}

// ! UrlFetchApp недоступен из простых триггеров (onEdit/onOpen).
function pingTelegram(): void {
  sendTelegram("hello world");
}

// Экспорт в глобал обязателен: иначе tree-shaking удалит точки входа, а GAS зовёт их по имени.
(globalThis as Record<string, unknown>).onEdit = onEdit;
(globalThis as Record<string, unknown>).onOpen = onOpen;
(globalThis as Record<string, unknown>).applyFormatting = applyFormatting;
(globalThis as Record<string, unknown>).pingTelegram = pingTelegram;