import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getConfig } from "../config";
import {
  DraftVersion,
  RepositoryCredentials,
  TableMetadataWithStatus,
  Version,
  VersionContent,
} from "@sharedTypes/index";
import {
  getRepositoryPath,
  getRepositoryRelativeTablePath,
  getTableNameFromFileName,
} from "../utils/utils";
import {
  AuthWithProvidedCredentialsError,
  NoCredentialsProvidedError,
  pushBranch,
} from "../utils/gitdb/push";
import { gitdb } from "../utils/gitdb/gitdb";

//#region API: get_current_version
export type GetCurrentVersionParameters = {
  repositoryId: string;
};

export type GetCurrentVersionResponse =
  | {
      status: "success";
      version: Version;
    }
  | {
      status: "error";
      type: "COULD NOT FIND CURRENT VERSION";
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function get_current_version({
  repositoryId,
}: GetCurrentVersionParameters): Promise<GetCurrentVersionResponse> {
  console.debug(
    `[API/get_current_version] Called with repositoryId=${repositoryId}`,
  );

  /*
   * Here's the algorithm to know on which version I am :
   *
   * Check if git HEAD is pointing to a current branch or in a detached HEAD mode
   *     If HEAD points to the current branch => I'm on a draft version
   *     If Detached HEAD => I'm on a Tag
   *
   * This works, because, in the App, HEAD can only point to a Branch or to a Tag. There's no other options
   */

  try {
    // Check where HEAD is pointing at
    const currentBranch = await git.currentBranch({
      fs,
      dir: getRepositoryPath(repositoryId),
    });

    const headStatus: "POINTS_TO_BRANCH" | "POINTS_TO_TAG" = currentBranch
      ? "POINTS_TO_BRANCH"
      : "POINTS_TO_TAG";

    console.debug(
      `[API/get_current_version] HEAD status is ${headStatus}, and current branch is ${currentBranch}`,
    );

    const headCommitOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "HEAD",
    });

    if (headStatus === "POINTS_TO_BRANCH") {
      const draftVersions = await gitdb.getDraftVersions({ repositoryId });

      // Even though, there's only a single draft, we will verify that HEAD points to it (in the future, we will have multiple drafts)
      for (const version of draftVersions) {
        const branchCommitOid = await git.resolveRef({
          fs,
          dir: getRepositoryPath(repositoryId),
          ref: version.branch,
        });

        if (branchCommitOid === headCommitOid) {
          return { status: "success", version };
        }
      }
    } else {
      const publishedVersions = await gitdb.getPublishedVersions({
        repositoryId,
      });

      for (const version of publishedVersions) {
        const tagCommitOid = await git.resolveRef({
          fs,
          dir: getRepositoryPath(repositoryId),
          ref: version.tag,
        });

        if (tagCommitOid === headCommitOid) {
          return { status: "success", version };
        }
      }
    }

    return {
      status: "error",
      type: "COULD NOT FIND CURRENT VERSION",
    };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(`[API/get_current_version] Error : ${error.name}`);
    } else {
      console.debug(`[API/get_current_version] Error`);
    }

    return { status: "error", type: "unknown" };
  }
}
//#endregion

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

      const branchCommits = await gitdb.getDraftVersionCommits({
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

//#region API: push_commits
export type PushCommitsParameters = {
  repositoryId: string;
  credentials?: RepositoryCredentials;
};

export type PushCommitsResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type:
        | "NOT_ON_DRAFT_VERSION"
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function push_commits({
  repositoryId,
  credentials,
}: PushCommitsParameters): Promise<PushCommitsResponse> {
  console.debug(`[API/push_commits] Called with repositoryId=${repositoryId}`);

  const currentVersionResp = await get_current_version({ repositoryId });
  if (currentVersionResp.status === "error") {
    return { status: "error", type: "UNKNOWN" };
  } else if (currentVersionResp.version.type !== "draft") {
    return { status: "error", type: "NOT_ON_DRAFT_VERSION" };
  }

  const currentDraftVersion: DraftVersion = currentVersionResp.version;

  try {
    await pushBranch({
      repositoryId,
      branchName: currentDraftVersion.branch,
      credentials,
    });

    const contentResp = await get_current_version_content({ repositoryId });
    if (contentResp.status === "error") {
      return { status: "error", type: "UNKNOWN" };
    }
    return { status: "success", content: contentResp.content };
  } catch (error) {
    console.debug(`[API/push_commits] Error pushing commits`);
    if (error instanceof NoCredentialsProvidedError) {
      return { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
    } else if (error instanceof AuthWithProvidedCredentialsError) {
      return { status: "error", type: "AUTH_ERROR_WITH_CREDENTIALS" };
    } else {
      return { status: "error", type: "UNKNOWN" };
    }
  }
}

//#endregion
