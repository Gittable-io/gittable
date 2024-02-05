import fs from "node:fs/promises";
import { Table } from "gittable-editor";
import { getRepositoryPath, getTablePath } from "../../utils/utils";
import { config } from "../../config";

/*
 TODO: Review the errors that are returned by those endpoints. Analyze different types of errors. Compare with repositories endpoint
*/
export type ListTablesResponse =
  | {
      status: "success";
      tableFileNames: string[];
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
    const tableFileNames = (await dirents)
      .filter(
        (dirent) =>
          dirent.isFile() && dirent.name.endsWith(config.fileExtensions.table),
      )
      .map((dirent) => dirent.name);
    return { status: "success", tableFileNames: tableFileNames };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type GetTableResponse =
  | {
      status: "success";
      table: Table;
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_table(
  repositoryId: string,
  tableFileName: string,
): Promise<GetTableResponse> {
  console.debug(`[API/table] get_table: tableFileName=${tableFileName}`);

  const tablePath = getTablePath(repositoryId, tableFileName);
  try {
    const data = await fs.readFile(tablePath, {
      encoding: "utf8",
    });
    const tableContent = JSON.parse(data) as Table;
    return { status: "success", table: tableContent };
  } catch (err: unknown) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type SaveTableResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function save_table(
  repositoryId: string,
  tableFileName: string,
  table: Table,
): Promise<SaveTableResponse> {
  console.debug(
    `[API/table] post_table: repository_id=${repositoryId}, tableFileName=${tableFileName}`,
  );

  try {
    const tablePath = getTablePath(repositoryId, tableFileName);
    const tableDataJson = JSON.stringify(table);
    await fs.writeFile(tablePath, tableDataJson, { encoding: "utf8" });
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      type: "unknown",
      message: "Unknown error",
    };
  }
}
