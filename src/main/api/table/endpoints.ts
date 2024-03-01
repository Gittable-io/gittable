import fs from "node:fs/promises";
import git from "isomorphic-git";

import { Table, tableToJsonString } from "gittable-editor";
import {
  getRepositoryPath,
  getTableNameFromFileName,
  getTablePath,
} from "../../utils/utils";
import { getConfig } from "../../config";
import {
  RepositoryStatus,
  TableMetadata,
  TableStatus,
} from "@sharedTypes/index";

/*
 TODO: Review the errors that are returned by those endpoints. Analyze different types of errors. Compare with repositories endpoint
*/

export type ListTablesParameters = {
  repositoryId: string;
};

export type ListTablesResponse =
  | {
      status: "success";
      tableMetadataList: TableMetadata[];
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function list_tables({
  repositoryId,
}: ListTablesParameters): Promise<ListTablesResponse> {
  console.debug(`[API/list_tables] Called with repositoryId=${repositoryId}`);

  try {
    const repositoryPath = getRepositoryPath(repositoryId);
    const dirents = fs.readdir(repositoryPath, {
      withFileTypes: true,
      recursive: false,
    });
    const tableMetadataList = (await dirents)
      .filter(
        (dirent) =>
          dirent.isFile() &&
          dirent.name.endsWith(getConfig().fileExtensions.table),
      )
      .map((dirent) => ({
        id: dirent.name,
        name: getTableNameFromFileName(dirent.name),
      }));
    return { status: "success", tableMetadataList: tableMetadataList };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type GetTableParameters = {
  repositoryId: string;
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
      message: "Unknown error";
    };

export async function get_table_data({
  repositoryId,
  tableId,
}: GetTableParameters): Promise<GetTableResponse> {
  console.debug(`[API/table] get_table_data: tableId=${tableId}`);

  const tablePath = getTablePath(repositoryId, tableId);
  try {
    const data = await fs.readFile(tablePath, {
      encoding: "utf8",
    });
    const tableContent = JSON.parse(data) as Table;
    return { status: "success", tableData: tableContent };
  } catch (err: unknown) {
    return { status: "error", type: "unknown", message: "Unknown error" };
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
      message: "Unknown error";
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
    const tablePath = getTablePath(repositoryId, tableId);
    const tableDataJson = tableToJsonString(tableData);
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

export type DiscardChangesParameters = {
  repositoryId: string;
};

export type DiscardChangesResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function discard_changes({
  repositoryId,
}: DiscardChangesParameters): Promise<DiscardChangesResponse> {
  console.debug(
    `[API/discard_changes] Called with repositoryId=${repositoryId}`,
  );

  try {
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      force: true, // If I remove force:true, discard doesn't work
    });
    return { status: "success" };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type GetRepositoryStatusParameters = {
  repositoryId: string;
};

export type GetRepositoryStatusResponse =
  | {
      status: "success";
      repositoryStatus: RepositoryStatus;
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_repository_status({
  repositoryId,
}: GetRepositoryStatusParameters): Promise<GetRepositoryStatusResponse> {
  console.debug(
    `[API/get_last_commit] Called with repositoryId=${repositoryId}`,
  );

  try {
    // 1. Get the last commit
    const log = await git.log({
      fs,
      dir: getRepositoryPath(repositoryId),
      depth: 1, // Just get the last commit
    });
    const lastCommitId = log[0].oid;

    const [FILE, HEAD, WORKDIR] = [0, 1, 2];
    const tablesStatuses: TableStatus[] = (
      await git.statusMatrix({
        fs,
        dir: getRepositoryPath(repositoryId),
        filter: (f) => f.endsWith(getConfig().fileExtensions.table),
      })
    ).map((tableStatus) => ({
      id: tableStatus[FILE] as string,
      name: getTableNameFromFileName(tableStatus[FILE] as string),
      modified: tableStatus[HEAD] !== tableStatus[WORKDIR],
    }));

    return {
      status: "success",
      repositoryStatus: { lastCommitId, tables: tablesStatuses },
    };
  } catch (err) {
    console.log(`[API/get_last_commit] Error calling git.log: ${err}`);
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
