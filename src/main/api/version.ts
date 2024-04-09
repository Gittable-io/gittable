import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getConfig } from "../config";
import { TableMetadataWithStatus, VersionContent } from "@sharedTypes/index";
import {
  getRepositoryPath,
  getRepositoryRelativeTablePath,
  getTableNameFromFileName,
} from "../utils/utils";

//#region API: get_checked_out_content
export type GetCheckedOutContentParameters = {
  repositoryId: string;
};

export type GetCheckedOutContentResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_checked_out_content({
  repositoryId,
}: GetCheckedOutContentParameters): Promise<GetCheckedOutContentResponse> {
  console.debug(
    `[API/get_checked_out_content] Called with repositoryId=${repositoryId}`,
  );

  try {
    const [FILE, HEAD, WORKDIR] = [0, 1, 2];
    const tables: TableMetadataWithStatus[] = (
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
      content: { tables },
    };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

//#endregion

//#region API: discard_changes
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

//#endregion

//#region API: commit
export type CommitParameters = {
  repositoryId: string;
  message: string;
};

export type CommitResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "NOTHING_TO_COMMIT";
      message: "There's nothing to commit";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function commit({
  repositoryId,
  message,
}: CommitParameters): Promise<CommitResponse> {
  console.debug(`[API/commit] Called with repositoryId=${repositoryId}`);

  // First check that there's something to commit (there's a change in the working dir)
  const contentResp = await get_checked_out_content({
    repositoryId,
  });

  if (contentResp.status === "error") {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }

  const tableStatuses: TableMetadataWithStatus[] = contentResp.content.tables;
  if (tableStatuses.every((table) => !table.modified)) {
    return {
      status: "error",
      type: "NOTHING_TO_COMMIT",
      message: "There's nothing to commit",
    };
  }

  // If there's a change in the working dir => stage each file and then commit it
  try {
    // 1. Add each file to the staging area
    const modifiedTables = tableStatuses.filter((table) => table.modified);

    for (const table of modifiedTables) {
      await git.add({
        fs,
        dir: getRepositoryPath(repositoryId),
        filepath: getRepositoryRelativeTablePath(table.id),
      });
    }

    // 1. And then commit
    await git.commit({
      fs,
      dir: getRepositoryPath(repositoryId),
      message,
    });
    return { status: "success" };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(`[API/commit] Error: ${error.name}`);
    }
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

//#endregion
