import fs from "node:fs/promises";
import { Table } from "gittable-editor";

export async function get_table(): Promise<Table> {
  try {
    const data = await fs.readFile("C:/Users/hhour/Desktop/test.table.json", {
      encoding: "utf8",
    });
    return JSON.parse(data) as Table;
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Error reading file: ${err.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
