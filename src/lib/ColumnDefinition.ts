import type { SheetDefinition } from "./SheetDefinition";

export class ColumnDefinition {
  constructor(readonly name: string) {}

  getIndex(sheetDef: SheetDefinition): number {
    const map = sheetDef.getColMap();
    const idx = map[this.name];
    if (idx === undefined) {
      throw new Error(`Не найдена колонка "${this.name}" в шапке листа ${sheetDef.name}`);
    }
    return idx;
  }
}
