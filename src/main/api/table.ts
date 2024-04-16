import fs from "node:fs/promises";
import fsync from "node:fs";
import git from "isomorphic-git";

import { Table, initializeTable, tableToJsonString } from "gittable-editor";
import {
  getRepositoryPath,
  getAbsoluteTablePath,
  getRepositoryRelativeTablePath,
} from "../utils/utils";
import { TableMetadata } from "@sharedTypes/index";

//#region API: get_table_data
export type GetTableParameters = {
  repositoryId: string;
  ref?: "HEAD" | "WorkingDir";
  tableId: string;
};

export type GetTableResponse =
  | {
      status: "success";
      tableData: Table;
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function get_table_data({
  repositoryId,
  ref = "WorkingDir",
  tableId,
}: GetTableParameters): Promise<GetTableResponse> {
  console.debug(
    `[API/get_table_data] Called with repositoryId=${repositoryId} ref=${ref} tableId=${tableId}`,
  );

  try {
    if (ref === "WorkingDir") {
      const data = await fs.readFile(
        getAbsoluteTablePath(repositoryId, tableId),
        {
          encoding: "utf8",
        },
      );
      const tableContent = JSON.parse(data) as Table;
      return { status: "success", tableData: tableContent };
    } else {
      const commitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: "HEAD",
      });

      const { blob } = await git.readBlob({
        fs,
        dir: getRepositoryPath(repositoryId),
        oid: commitOid,
        filepath: getRepositoryRelativeTablePath(tableId),
      });

      const tableContent = JSON.parse(
        Buffer.from(blob).toString("utf8"),
      ) as Table;
      return { status: "success", tableData: tableContent };
    }
  } catch (err: unknown) {
    return { status: "error", type: "unknown" };
  }
}
//#endregion

//#region API: save_table
export type SaveTableParameters = {
  repositoryId: string;
  tableId: string;
  tableData: Table;
};

export type SaveTableResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function save_table({
  repositoryId,
  tableId,
  tableData,
}: SaveTableParameters): Promise<SaveTableResponse> {
  console.debug(
    `[API/save_table] Called with repository_id=${repositoryId}, tableId=${tableId}`,
  );

  try {
    const tablePath = getAbsoluteTablePath(repositoryId, tableId);
    const tableDataJson = tableToJsonString(tableData);
    await fs.writeFile(tablePath, tableDataJson, { encoding: "utf8" });
    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      type: "unknown",
    };
  }
}
//#endregion

//#region API: add_table
export type AddTableParameters = {
  repositoryId: string;
  name: string;
};

export type AddTableResponse =
  | {
      status: "success";
      table: TableMetadata;
    }
  | {
      status: "error";
      type: "TABLE_ALREADY_EXISTS" | "UNKNNOWN";
    };

export async function add_table({
  repositoryId,
  name,
}: AddTableParameters): Promise<AddTableResponse> {
  console.debug(
    `[API/add_table] Called with repositoryId=${repositoryId} name=${name}`,
  );

  // 1. Check if table already exists
  const tableId = name;
  const tablePath = getAbsoluteTablePath(repositoryId, tableId);
  if (fsync.existsSync(tablePath))
    return { status: "error", type: "TABLE_ALREADY_EXISTS" };

  // 2. Create table
  try {
    const newTable: Table = initializeTable();
    const tableDataJson = tableToJsonString(newTable);
    await fs.writeFile(tablePath, tableDataJson, { encoding: "utf8" });
    return { status: "success", table: { id: tableId, name } };
  } catch (error) {
    if (error instanceof Error)
      console.debug(`[API/add_table] Error creating table: ${error.message}`);

    return {
      status: "error",
      type: "UNKNNOWN",
    };
  }
}

//#endregion
