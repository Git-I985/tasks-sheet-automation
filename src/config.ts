import { FileConfig } from "./lib/FileConfig";
import { tasksSheet } from "./sheets/Tasks";
import { valuesSheet } from "./sheets/Values";

export const fileConfig = new FileConfig([tasksSheet, valuesSheet]);