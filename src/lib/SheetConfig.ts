import type { ColumnDefinition } from "./ColumnDefinition";
import type { SheetDefinition } from "./SheetDefinition";

export type SheetEditHandler = (
  this: SheetDefinition,
  e?: GoogleAppsScript.Events.SheetsOnEdit,
) => void;

// ref(имя колонки) -> A1-ссылка с фиксированной колонкой и относительной строкой, напр. "$H2".
export type ColRef = (columnName: string) => string;

// Колонки и ссылки формулы задаются по ИМЕНАМ; буквы A1 резолвятся из шапки в рантайме.
export interface ConditionalFormat {
  columns: string[];
  formula: (ref: ColRef) => string;
  fontColor?: string;
  background?: string;
  bold?: boolean;
}

export interface SheetConfig {
  name: string;
  cols: ColumnDefinition[];
  headerRow?: number;
  onEdit?: SheetEditHandler;
  formats?: ConditionalFormat[];
}
