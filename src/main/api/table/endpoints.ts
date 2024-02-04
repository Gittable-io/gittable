import fs from "node:fs/promises";
import { Table } from "gittable-editor";
import { getRepositoryPath } from "../../utils/utils";
import { config } from "../../config";

export type ListTablesResponse =
  | {
      status: "success";
      tables: string[];
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function list_tables(
  repositoryId: string,
): Promise<ListTablesResponse> {
  console.debug(`[API/list_tables] Called with repositoryId=${repositoryId}`);

  try {
    const repositoryPath = getRepositoryPath(repositoryId);
    const dirents = fs.readdir(repositoryPath, {
      withFileTypes: true,
      recursive: false,
    });
    const tableFiles = (await dirents)
      .filter(
        (dirent) =>
          dirent.isFile() && dirent.name.endsWith(config.fileExtensions.table),
      )
      .map((dirent) => dirent.name);
    return { status: "success", tables: tableFiles };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

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
