import fs from "node:fs/promises";
import git from "isomorphic-git";

import { Table, tableToJsonString } from "gittable-editor";
import {
  getRepositoryPath,
  getAbsoluteTablePath,
  getRepositoryRelativeTablePath,
} from "../utils/utils";

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
    `[API/table] get_table_data: repositoryId=${repositoryId} ref=${ref} tableId=${tableId}`,
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
    `[API/table] save_table: repository_id=${repositoryId}, tableId=${tableId}`,
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
