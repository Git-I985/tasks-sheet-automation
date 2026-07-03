import type { ColumnDefinition } from "./ColumnDefinition";
import type { ColRef, ConditionalFormat, SheetConfig, SheetEditHandler } from "./SheetConfig";

type ColMap = Record<string, number>;

export class SheetDefinition {
  readonly name: string;
  readonly cols: ColumnDefinition[];
  readonly headerRow: number;
  readonly onEdit?: SheetEditHandler;
  readonly formats: ConditionalFormat[];

  constructor(config: SheetConfig) {
    this.name = config.name;
    this.cols = config.cols;
    this.headerRow = config.headerRow ?? 1;
    this.onEdit = config.onEdit;
    this.formats = config.formats ?? [];
  }

  getSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(this.name);
    if (!sh) throw new Error(`Лист "${this.name}" не найден в таблице`);
    return sh;
  }

  getColMap(): ColMap {
    const sh = this.getSheet();
    const numCols = sh.getLastColumn();
    const headers = sh.getRange(this.headerRow, 1, 1, numCols).getValues()[0];
    const map: ColMap = {};
    headers.forEach((h, i) => {
      map[String(h).trim()] = i;
    });
    return map;
  }

  getColumn(name: string): ColumnDefinition {
    const col = this.cols.find((c) => c.name === name);
    if (!col) {
      throw new Error(`Колонка "${name}" не описана в конфиге листа ${this.name}`);
    }
    return col;
  }

  getColumnNumber(name: string): number {
    return this.getColumn(name).getIndex(this) + 1;
  }

  getCell(row: number, name: string): GoogleAppsScript.Spreadsheet.Range {
    return this.getSheet().getRange(row, this.getColumnNumber(name));
  }

  getColumnLetter(name: string): string {
    return this.getSheet()
      .getRange(1, this.getColumnNumber(name))
      .getA1Notation()
      .replace(/[0-9]/g, "");
  }

  // Idempotent: заменяет ВСЕ правила форматирования листа (не добавляет).
  applyFormatting(): void {
    const sh = this.getSheet();
    const base = this.headerRow + 1;
    const ref: ColRef = (name) => `$${this.getColumnLetter(name)}${base}`;

    const rules = this.formats.map((f) => {
      const ranges = f.columns.map((name) => {
        const L = this.getColumnLetter(name);
        return sh.getRange(`${L}${base}:${L}`);
      });
      let b = SpreadsheetApp.newConditionalFormatRule()
        .whenFormulaSatisfied(f.formula(ref))
        .setRanges(ranges);
      if (f.fontColor) b = b.setFontColor(f.fontColor);
      if (f.background) b = b.setBackground(f.background);
      if (f.bold) b = b.setBold(true);
      return b.build();
    });
    sh.setConditionalFormatRules(rules);
  }

  getColumnValues(name: string): string[] {
    const sh = this.getSheet();
    const colIdx = this.getColumn(name).getIndex(this);
    const last = sh.getLastRow();
    if (last <= this.headerRow) return [];
    const numRows = last - this.headerRow;
    return sh
      .getRange(this.headerRow + 1, colIdx + 1, numRows, 1)
      .getValues()
      .flat()
      .map(String)
      .filter(Boolean);
  }
}
