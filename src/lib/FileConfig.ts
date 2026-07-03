import type { SheetDefinition } from "./SheetDefinition";

export class FileConfig {
  constructor(readonly sheets: SheetDefinition[]) {}

  getSheet(name: string): SheetDefinition {
    const sheetDef = this.sheets.find((s) => s.name === name);
    if (!sheetDef) {
      throw new Error(`Лист "${name}" не описан в конфиге`);
    }
    return sheetDef;
  }
}
