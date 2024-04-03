import fs from "node:fs/promises";
import git, { PushResult, ReadCommitResult } from "isomorphic-git";
import http from "isomorphic-git/http/node";

import { Table, tableToJsonString } from "gittable-editor";
import {
  getRepositoryPath,
  getTableNameFromFileName,
  getAbsoluteTablePath,
  getRepositoryRelativeTablePath,
} from "../../utils/utils";
import { getConfig } from "../../config";
import {
  RepositoryCredentials,
  RepositoryStatus,
  TableMetadata,
  TableStatus,
} from "@sharedTypes/index";
import { UserDataStore } from "../../db";

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

// ! Note : this endpoint is no longer used as from 1/03/2024. Consider removing it after some times
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
      message: "Unknown error";
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
    const tablePath = getAbsoluteTablePath(repositoryId, tableId);
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
    `[API/get_repository_status] Called with repositoryId=${repositoryId}`,
  );

  try {
    // 2. Get the current branch name
    const currentBranch = (await git.currentBranch({
      fs,
      dir: getRepositoryPath(repositoryId),
    })) as string;
    /*
    ! Here I'm assuming that there's always a current branch. But git.currentBranch() will return void if
    ! there's no branch (the git repo has just been init) or the HEAD is detached
    ! For now, the features of this app doesn't allow those states. so I'm considering that git.currentBranch() will
    ! always return a string
    */

    // 3. Check if the current checked out branch is ahead of remote
    // 3.1 Get the remote name
    const remote = (
      await git.listRemotes({
        fs,
        dir: getRepositoryPath(repositoryId),
      })
    )[0].remote;
    //! We assume that there's always a single remote. We don't handle multiple remotes

    // 3.2 Get the commit SHA of the local branch and the remote branch
    const localBranchRef = `refs/heads/${currentBranch}`;
    const remoteBranchRef = `refs/remotes/${remote}/${currentBranch}`;

    // const localCommit = await git.resolveRef({
    //   fs,
    //   dir: getRepositoryPath(repositoryId),
    //   ref: localBranchRef,
    // });
    const remoteCommit = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: remoteBranchRef,
    });

    // 3.3 Get the commit logs for the local and remote branches
    const localLog = await git.log({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: localBranchRef,
    });
    // ! I'll need this code below when I handle the case of the local branch being behind the remote
    // const remoteLog = await git.log({
    //   fs,
    //   dir: getRepositoryPath(repositoryId),
    //   ref: remoteBranchRef,
    // });

    // 3.4 Check if the local branch is ahead by comparing commit logs
    const isAheadOfRemote =
      localLog.findIndex((commit) => commit.oid === remoteCommit) > 0;

    // 4. For each table, check if it's version in the Working dir is different than the Local repository
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
      repositoryStatus: {
        tables: tablesStatuses,
        currentBranch: { name: currentBranch, isAheadOfRemote },
      },
    };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

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
  const repositoryStatusResponse = await get_repository_status({
    repositoryId,
  });

  if (repositoryStatusResponse.status === "error") {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }

  const repositoryStatus = repositoryStatusResponse.repositoryStatus;
  if (repositoryStatus.tables.every((table) => !table.modified)) {
    return {
      status: "error",
      type: "NOTHING_TO_COMMIT",
      message: "There's nothing to commit",
    };
  }

  // If there's a change in the working dir => stage each file and then commit it
  try {
    // 1. Add each file to the staging area
    const modifiedTables = repositoryStatus.tables.filter(
      (table) => table.modified,
    );

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
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type GetHistoryParameters = {
  repositoryId: string;
};

export type GetHistoryResponse = {
  status: "success";
  history: ReadCommitResult[];
};

export async function get_history({
  repositoryId,
}: GetHistoryParameters): Promise<GetHistoryResponse> {
  console.debug(`[API/get_history] Called with repositoryId=${repositoryId}`);

  const history = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  return { status: "success", history };
}

export type PushParameters = {
  repositoryId: string;
  credentials?: RepositoryCredentials;
};

export type PushResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "No credentials provided";
      message: "Credentials are required to share your changes";
    }
  | {
      status: "error";
      type: "Error authenticating with provided credentials";
      message: "Incorrect credentials. Please try again.";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function push({
  repositoryId,
  credentials: providedCredentials,
}: PushParameters): Promise<PushResponse> {
  console.debug(
    `[API/push] Called with repositoryId=${repositoryId} ${providedCredentials ? "with" : "without"} credentials`,
  );

  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    console.debug(
      `[API/push] No credentials were provided and couldn't find credentials in db`,
    );

    return {
      status: "error",
      type: "No credentials provided",
      message: "Credentials are required to share your changes",
    };
  }

  let errorResponse: PushResponse | null = null;
  let pushResult: PushResult | null = null;

  try {
    pushResult = await git.push({
      fs,
      http,
      dir: getRepositoryPath(repositoryId),
      onAuth: () => {
        return credentials;
      },
      onAuthFailure: () => {
        console.debug(`[API/push] onAuthFailure`);

        errorResponse = {
          status: "error",
          type: "Error authenticating with provided credentials",
          message: "Incorrect credentials. Please try again.",
        };

        return { cancel: true };
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "UserCanceledError" && errorResponse) {
        // I canceled the operation myself, and the response is already set
      } else {
        errorResponse = {
          status: "error",
          type: "unknown",
          message: "Unknown error",
        };
      }
    } else {
      errorResponse = {
        status: "error",
        type: "unknown",
        message: "Unknown error",
      };
    }
  }

  // In case of error
  if (errorResponse) {
    return errorResponse;
  } else if (!pushResult || pushResult.error) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }

  // In case of success
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }
  return { status: "success" };
}
