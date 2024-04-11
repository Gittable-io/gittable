import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getConfig } from "../config";
import { TableMetadataWithStatus, VersionContent } from "@sharedTypes/index";
import {
  getRepositoryPath,
  getRepositoryRelativeTablePath,
  getTableNameFromFileName,
} from "../utils/utils";
import { get_current_version } from "./repository";
import { getDraftVersionCommits } from "../utils/git/commit";

//#region API: get_current_version_content
export type GetCurrentVersionContentParameters = {
  repositoryId: string;
};

export type GetCurrentVersionContentResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function get_current_version_content({
  repositoryId,
}: GetCurrentVersionContentParameters): Promise<GetCurrentVersionContentResponse> {
  console.debug(
    `[API/get_current_version_content] Called with repositoryId=${repositoryId}`,
  );

  try {
    const currentVersionResp = await get_current_version({ repositoryId });
    if (currentVersionResp.status === "error") {
      throw new Error();
    }
    const currentVersion = currentVersionResp.version;

    if (currentVersion.type === "draft") {
      // 1. Get tables and their statuses
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

      const branchCommits = await getDraftVersionCommits({
        repositoryId,
        draftVersion: currentVersion,
      });

      return {
        status: "success",
        content: { tables, commits: branchCommits },
      };
    } else {
      const [FILE] = [0];
      const tables: TableMetadataWithStatus[] = (
        await git.statusMatrix({
          fs,
          dir: getRepositoryPath(repositoryId),
          filter: (f) => f.endsWith(getConfig().fileExtensions.table),
        })
      ).map((tableStatus) => ({
        id: tableStatus[FILE] as string,
        name: getTableNameFromFileName(tableStatus[FILE] as string),
        modified: false,
      }));

      return {
        status: "success",
        content: { tables, commits: [] },
      };
    }
  } catch (err) {
    return { status: "error", type: "unknown" };
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
    return { status: "error", type: "unknown" };
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
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function commit({
  repositoryId,
  message,
}: CommitParameters): Promise<CommitResponse> {
  console.debug(`[API/commit] Called with repositoryId=${repositoryId}`);

  // First check that there's something to commit (there's a change in the working dir)
  const contentResp = await get_current_version_content({
    repositoryId,
  });

  if (contentResp.status === "error") {
    return { status: "error", type: "unknown" };
  }

  const tableStatuses: TableMetadataWithStatus[] = contentResp.content.tables;
  if (tableStatuses.every((table) => !table.modified)) {
    return {
      status: "error",
      type: "NOTHING_TO_COMMIT",
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
    return { status: "error", type: "unknown" };
  }
}

//#endregion
