import { addHours, addMonths, addYears, startOfDay } from "date-fns";
import { ColumnDefinition } from "../lib/ColumnDefinition";
import type { ConditionalFormat } from "../lib/SheetConfig";
import { SheetDefinition } from "../lib/SheetDefinition";
import { ValuesColumns, valuesSheet } from "./Values";

// Сентинел «пусто/неизвестно → в конец» для ключей сортировки.
const LAST = Number.MAX_SAFE_INTEGER;

const STATUS_DONE = "Done";

type Row = unknown[];
type PriorityRank = Record<string, number>;

export enum TasksColumns {
  Recurring = "⟳",
  Priority = "Priority",
  Summary = "Summary",
  Status = "Status",
  Actions = "Actions",
  Date = "When / Deadline",
  Tags = "Tags",
  EveryValue = "Every value",
  EveryUnit = "Every unit",
}

export enum TaskAction {
  Done = "Done",
  Activate = "Activate",
}

export enum EveryUnit {
  Hour = "Hour",
  Day = "Day",
  Week = "Week",
  Month = "Month",
  Year = "Year",
}

function readPriorityRank(): PriorityRank {
  const rank: PriorityRank = {};
  valuesSheet.getColumnValues(ValuesColumns.Priority).forEach((p, i) => {
    rank[p] = i;
  });
  return rank;
}

function dateKey(row: Row, col: number): number {
  const v = row[col];
  return v instanceof Date ? v.getTime() : LAST;
}

function priorityKey(row: Row, col: number, rank: PriorityRank): number {
  const p = String(row[col]).trim();
  return p && p in rank ? rank[p] : LAST;
}

// Сортировка: по дате (старые → новые), при равенстве — по порядку приоритетов из листа Values.
export function sort(this: SheetDefinition): void {
  const sh = this.getSheet();

  const last = sh.getLastRow();
  if (last < this.headerRow + 2) return;

  const rank = readPriorityRank();
  const dateCol = this.getColumn(TasksColumns.Date).getIndex(this);
  const prioCol = this.getColumn(TasksColumns.Priority).getIndex(this);

  const range = sh.getRange(this.headerRow + 1, 1, last - this.headerRow, sh.getLastColumn());
  const rows = range.getValues();

  rows.sort(
    (a, b) =>
      dateKey(a, dateCol) - dateKey(b, dateCol) ||
      priorityKey(a, prioCol, rank) - priorityKey(b, prioCol, rank),
  );

  range.setValues(rows);
}

function parseUnit(v: unknown): EveryUnit | null {
  const s = String(v).trim();
  return (Object.values(EveryUnit) as string[]).includes(s) ? (s as EveryUnit) : null;
}

// Hour/Day/Week — точно, дробные ок. Month/Year — календарно, дробная часть отбрасывается.
function addInterval(date: Date, value: number, unit: EveryUnit): Date {
  switch (unit) {
    case EveryUnit.Hour:
      return addHours(date, value);
    case EveryUnit.Day:
      return addHours(date, value * 24);
    case EveryUnit.Week:
      return addHours(date, value * 24 * 7);
    case EveryUnit.Month:
      return addMonths(date, value);
    case EveryUnit.Year:
      return addYears(date, value);
  }
}

function done(sheet: SheetDefinition, row: number): void {
  const recurring = sheet.getCell(row, TasksColumns.Recurring).getValue() === true;

  if (!recurring) {
    sheet.getCell(row, TasksColumns.Status).setValue(STATUS_DONE);
    return;
  }

  const value = Number(sheet.getCell(row, TasksColumns.EveryValue).getValue());
  const unit = parseUnit(sheet.getCell(row, TasksColumns.EveryUnit).getValue());
  const date = sheet.getCell(row, TasksColumns.Date).getValue();
  if (!value || !unit || !(date instanceof Date)) return;

  sheet.getCell(row, TasksColumns.Date).setValue(addInterval(date, value, unit));
}

function activate(sheet: SheetDefinition, row: number): void {
  sheet.getCell(row, TasksColumns.Date).setValue(startOfDay(new Date()));
}

function handleAction(sheet: SheetDefinition, e: GoogleAppsScript.Events.SheetsOnEdit): void {
  const cell = e.range;
  if (cell.getNumRows() !== 1 || cell.getNumColumns() !== 1) return;

  const row = cell.getRow();
  if (row <= sheet.headerRow) return;
  if (cell.getColumn() !== sheet.getColumnNumber(TasksColumns.Actions)) return;

  const action = String(cell.getValue()).trim();
  if (action === TaskAction.Done) {
    done(sheet, row);
  } else if (action === TaskAction.Activate) {
    activate(sheet, row);
  } else {
    return;
  }

  cell.clearContent(); // Правка ячейки скриптом повторно onEdit не триггерит.
}

function onTasksEdit(this: SheetDefinition, e?: GoogleAppsScript.Events.SheetsOnEdit): void {
  if (e) handleAction(this, e);
  sort.call(this);
}

// Алиас T (не деструктуризация) — иначе `Date` затенил бы глобальный конструктор.
// Порядок правил = приоритет: верхнее выигрывает конфликт.
const T = TasksColumns;
const formats: ConditionalFormat[] = [
  {
    columns: [T.Date],
    fontColor: "#CB4125",
    formula: (ref) => `=AND(INT(${ref(T.Date)})<TODAY();${ref(T.Status)}<>"Done")`,
  },
  {
    columns: [T.Date],
    fontColor: "#E69238",
    formula: (ref) =>
      `=AND(OR(INT(${ref(T.Date)})=TODAY();INT(${ref(T.Date)})=TODAY()+1);${ref(T.Status)}<>"Done")`,
  },
  {
    columns: [T.Summary],
    fontColor: "#CC0000",
    background: "#F4CCCC",
    bold: true,
    formula: (ref) =>
      `=AND(${ref(T.Date)}<>"";${ref(T.Date)}<TODAY();${ref(T.Priority)}="High";${ref(T.Status)}<>"Done")`,
  },
  {
    columns: [T.Summary],
    fontColor: "#CC0000",
    background: "#F4CCCC",
    formula: (ref) => `=AND(${ref(T.Date)}<>"";${ref(T.Date)}<TODAY();${ref(T.Status)}<>"Done")`,
  },
  {
    columns: [T.Summary],
    bold: true,
    formula: (ref) => `=${ref(T.Priority)}="High"`,
  },
  {
    columns: [T.Recurring],
    fontColor: "#1155CC",
    formula: (ref) => `=${ref(T.Recurring)}=TRUE`,
  },
];

export const tasksSheet = new SheetDefinition({
  name: "Tasks",
  cols: [
    new ColumnDefinition(TasksColumns.Recurring),
    new ColumnDefinition(TasksColumns.Priority),
    new ColumnDefinition(TasksColumns.Summary),
    new ColumnDefinition(TasksColumns.Status),
    new ColumnDefinition(TasksColumns.Actions),
    new ColumnDefinition(TasksColumns.Date),
    new ColumnDefinition(TasksColumns.Tags),
    new ColumnDefinition(TasksColumns.EveryValue),
    new ColumnDefinition(TasksColumns.EveryUnit),
  ],
  onEdit: onTasksEdit,
  formats,
});
