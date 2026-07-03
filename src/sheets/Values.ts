import { ColumnDefinition } from "../lib/ColumnDefinition";
import { SheetDefinition } from "../lib/SheetDefinition";

export enum ValuesColumns {
  Priority = "Priority",
}

export const valuesSheet = new SheetDefinition({
  name: "Values",
  cols: [new ColumnDefinition(ValuesColumns.Priority)],
});
