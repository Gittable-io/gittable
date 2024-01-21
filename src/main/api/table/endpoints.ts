import fs from "node:fs/promises";
import { Table } from "gittable-editor";

export async function get_table(path: string): Promise<Table> {
  console.debug(`[API/table] get_table: path=${path}`);
  try {
    const data = await fs.readFile(path, {
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

export async function post_table(
  path: string,
  tableData: Table,
): Promise<void> {
  console.debug(`[API/table] post_table`);

  try {
    const tableDataJson = JSON.stringify(tableData);
    await fs.writeFile(path, tableDataJson, { encoding: "utf8" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw new Error(`Error reading file: ${err.message}`);
    } else {
      throw new Error("An unknown error occurred");
    }
  }
}
