import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../utils/utils";
import {
  DraftVersion,
  PublishedVersion,
  RepositoryCredentials,
  RepositoryStatus,
  Version,
  VersionContent,
  VersionContentComparison,
} from "@sharedTypes/index";
import { get_current_version, get_current_version_content } from "./version";
import _ from "lodash";
import {
  AuthWithProvidedCredentialsError,
  NoCredentialsProvidedError,
  pushBranch,
} from "../utils/gitdb/push";
import { gitdb } from "../utils/gitdb/gitdb";
import { repoBackup } from "../utils/gitdb/repoBackup";

//#region API: get_repository_status
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
      type: "UNKNOWN";
    };

export async function get_repository_status({
  repositoryId,
}: GetRepositoryStatusParameters): Promise<GetRepositoryStatusResponse> {
  console.debug(
    `[API/get_repository_status] Called with repositoryId=${repositoryId}`,
  );

  try {
    const isRepositoryInitialized = await gitdb.isRepositoryInitialized({
      repositoryId,
    });

    if (!isRepositoryInitialized) {
      return {
        status: "success",
        repositoryStatus: "NOT_INITIALIZED",
      };
    }

    const hasPublished = await gitdb.hasPublished({
      repositoryId,
    });

    return {
      status: "success",
      repositoryStatus: hasPublished ? "HAS_PUBLISHED" : "DRAFT_ONLY",
    };
  } catch (error) {
    return { status: "error", type: "UNKNOWN" };
  }
}

//#endregion

//#region API: init repository
export type InitRepositoryParameters = {
  repositoryId: string;
  credentials?: RepositoryCredentials;
};

export type InitRepositoryResponse =
  | {
      status: "success";
      // repositoryStatus: RepositoryStatus;
    }
  | {
      status: "error";
      type:
        | "ALREADY_INITIALIZED"
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

/**
 * Initialize an empty repsitory: i.e. transform it from an Empty repo to an Initial repo
 *
 * To do that :
 * 1. Init repo and setup init.defaultBranch to "main"
 * 1. Create a branch named "main"
 * 1. Create an empty commit on "main"
 * 2. Create a draft branch "draft/initial" from that empty commit
 * 4. Push "main" and "draft/initial"
 * 3. Checkout to the draft branch "draft/initial"
 */
export async function init_repository({
  repositoryId,
  credentials,
}: InitRepositoryParameters): Promise<InitRepositoryResponse> {
  console.debug(
    `[API/init_repository] Called with repositoryId=${repositoryId}`,
  );

  let errorResponse: InitRepositoryResponse | null = null;
  try {
    // 0. Check that repository is not initialized
    const isRepositoryInitialized = await gitdb.isRepositoryInitialized({
      repositoryId,
    });
    if (isRepositoryInitialized) {
      return { status: "error", type: "ALREADY_INITIALIZED" };
    }

    // Before doing anything, backup the repo
    repoBackup.backup(repositoryId);

    // 1. Init repository so that init.defaultBranch is set up correctly to main
    await git.init({
      fs,
      dir: getRepositoryPath(repositoryId),
      defaultBranch: "main",
    });

    await git.branch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "main",
      checkout: true,
    });

    // 2. Create an empty commit on "main" and push it
    await git.commit({
      fs,
      dir: getRepositoryPath(repositoryId),
      message: "INITIAL_COMMIT",
    });

    // 3. Create a draft branch "draft/initial" from that empty commit
    await git.branch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "draft/initial",
    });

    // 3. Checkout to the draft branch "draft/initial"
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "draft/initial",
    });

    // 2.1 Push main and draft/initial branches
    await pushBranch({
      repositoryId,
      branchName: "main",
      credentials,
    });

    await pushBranch({
      repositoryId,
      branchName: "draft/initial",
      credentials,
    });
  } catch (error) {
    console.debug(
      `[API/init_repository] Error pushing newly created main branch`,
    );
    if (error instanceof NoCredentialsProvidedError) {
      errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
    } else if (error instanceof AuthWithProvidedCredentialsError) {
      errorResponse = { status: "error", type: "AUTH_ERROR_WITH_CREDENTIALS" };
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    if (errorResponse) {
      repoBackup.restore(repositoryId);
    } else {
      repoBackup.clear(repositoryId);
    }
  }

  if (errorResponse) return errorResponse;

  return { status: "success" };
}

//#endregion

//#region API: list_versions
export type ListVersionsParameters = {
  repositoryId: string;
};

export type ListVersionsResponse =
  | {
      status: "success";
      versions: Version[];
    }
  | {
      status: "error";
      type: "COULD NOT DETERMINE LATEST VERSION";
    }
  | {
      status: "error";
      type: "HEAD does not point to a Tag";
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function list_versions({
  repositoryId,
}: ListVersionsParameters): Promise<ListVersionsResponse> {
  console.debug(`[API/list_versions] Called with repositoryId=${repositoryId}`);

  try {
    const publishedVersions: PublishedVersion[] =
      await gitdb.getPublishedVersions({ repositoryId });
    const draftVersions: DraftVersion[] = await gitdb.getDraftVersions({
      repositoryId,
    });

    const versions: Version[] = [...draftVersions, ...publishedVersions];

    return { status: "success", versions };
  } catch (error) {
    return { status: "error", type: "unknown" };
  }
}
//#endregion

//#region API: switch_version
export type SwitchVersionParameters = {
  repositoryId: string;
  version: Version;
};

export type SwitchVersionResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type: "Cannot find version";
    }
  | {
      status: "error";
      type: "unknown";
    };

/**
 * Switches HEAD to a version
 *  - If version is a Draft version: it switches to a branch
 *  - If version is a Published version: it switches to a Tag
 *
 * If switching from a Draft version, and there are changes in the working dir, they are discarded
 *
 * @returns
 */
export async function switch_version({
  repositoryId,
  version,
}: SwitchVersionParameters): Promise<SwitchVersionResponse> {
  console.debug(
    `[API/switch_version] Called with repositoryId=${repositoryId} and version=${JSON.stringify(version)}`,
  );
  try {
    // 0. Discard changes in the working dir
    // * I could've verified first that Working dir != local repository, but for now, I'm doing a discard in all cases
    // TODO: In the future : stash before switching from a draft and reapply stash when switching back
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      force: true, // If I remove force:true, discard doesn't work
    });

    // 1. Switch to branch or tag
    const ref = version.type === "published" ? version.tag : version.branch;

    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref,
    });

    // 2. Get the new content and return it
    const response = await get_current_version_content({ repositoryId });
    if (response.status === "error") throw new Error();

    return { status: "success", content: response.content };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/switch_version] error.name=${error.name}, error.message=${error.message}`,
      );
    }

    return { status: "error", type: "unknown" };
  }
}
//#endregion

//#region API: create_draft
export type CreateDraftParameters = {
  repositoryId: string;
  name: string;
  credentials?: RepositoryCredentials;
};

export type CreateDraftResponse =
  | {
      status: "success";
      version: DraftVersion;
    }
  | {
      status: "error";
      type:
        | "VERSION_ALREADY_EXISTS"
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function create_draft({
  repositoryId,
  name: draftName,
  credentials,
}: CreateDraftParameters): Promise<CreateDraftResponse> {
  console.debug(
    `[API/create_draft] Called with repositoryId=${repositoryId} and name=${draftName}`,
  );

  const branchName = `draft/${draftName}`;

  try {
    // 1. Create branch
    // 1.1. First check that a draft version of the same name is not already created
    const draftVersions = await gitdb.getDraftVersions({ repositoryId });
    const versionExists = draftVersions.some((v) => v.name === draftName);
    if (versionExists) {
      console.debug(`[API/create_draft] Version already exists`);
      return {
        status: "error",
        type: "VERSION_ALREADY_EXISTS",
      };
    }

    // 1.2 Create a new branch from the latest published version or the initial commit if there's no published version
    const lastPublishedVersion = await gitdb.getLastPublishedVersion({
      repositoryId,
    });

    const branchBaseRef = lastPublishedVersion
      ? lastPublishedVersion.tag
      : await gitdb.getInitialCommitOid({ repositoryId });

    await git.branch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: branchName,
      object: branchBaseRef,
    });
    console.debug(`[API/create_draft] Created local branch`);
  } catch (error) {
    console.debug(`[API/create_draft] Error creating local branch`);
    return { status: "error", type: "UNKNOWN" };
  }

  let errorResponse: CreateDraftResponse | null = null;
  try {
    // 2. Push branch
    await pushBranch({ repositoryId, branchName, credentials });
  } catch (error) {
    console.debug(`[API/create_draft] Error pushing local branch`);
    if (error instanceof NoCredentialsProvidedError) {
      errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
    } else if (error instanceof AuthWithProvidedCredentialsError) {
      errorResponse = { status: "error", type: "AUTH_ERROR_WITH_CREDENTIALS" };
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    // If there's an error in pushing branch, delete created branch
    if (errorResponse) {
      console.debug(
        `[API/create_draft] Error pushing local branch: deleting local branch`,
      );
      await git.deleteBranch({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: branchName,
      });
    }
  }

  if (errorResponse) {
    console.debug(`[API/create_draft] Returning error`);
    return errorResponse;
  } else {
    // 3. Return newly created version
    console.debug(`[API/create_draft] Returning success`);
    const version = (await gitdb.getDraftVersion({
      repositoryId,
      branch: branchName,
    }))!;
    return {
      status: "success",
      version,
    };
  }
}
//#endregion

//#region API: delete_draft
export type DeleteDraftParameters = {
  repositoryId: string;
  version: DraftVersion;
  credentials?: RepositoryCredentials;
};

export type DeleteDraftResponse =
  | {
      status: "success";
      versions: Version[];
    }
  | {
      status: "error";
      type:
        | "DRAFT_VERSION_OPENED"
        | "DRAFT_VERSION_DO_NOT_EXIST"
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function delete_draft({
  repositoryId,
  version: versionToDelete,
  credentials,
}: DeleteDraftParameters): Promise<DeleteDraftResponse> {
  console.debug(
    `[API/delete_draft] Called with repositoryId=${repositoryId} and version=${JSON.stringify(versionToDelete)}`,
  );

  // 1. Check that draft version exists
  const draftVersions = await gitdb.getDraftVersions({ repositoryId });
  if (!draftVersions.find((dv) => _.isEqual(dv, versionToDelete))) {
    return {
      status: "error",
      type: "DRAFT_VERSION_DO_NOT_EXIST",
    };
  }

  // 2. Check that we're not in actual draft version
  const currentVersionResp = await get_current_version({ repositoryId });
  if (currentVersionResp.status === "error") {
    return { status: "error", type: "UNKNOWN" };
  }
  if (_.isEqual(currentVersionResp.version, versionToDelete)) {
    return {
      status: "error",
      type: "DRAFT_VERSION_OPENED",
    };
  }

  /*
   * We're first deleting the remote, before deleting the local branch
   * In case of error in deleting a remote branch, there's no need to recover the local branch
   */
  try {
    // 3. Delete remote branch
    await pushBranch({
      repositoryId,
      branchName: versionToDelete.branch,
      credentials,
      deleteBranch: true,
    });
  } catch (error) {
    console.debug(`[API/delete_draft] Error deleting remote branch`);
    if (error instanceof NoCredentialsProvidedError) {
      return { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
    } else if (error instanceof AuthWithProvidedCredentialsError) {
      return { status: "error", type: "AUTH_ERROR_WITH_CREDENTIALS" };
    } else {
      return { status: "error", type: "UNKNOWN" };
    }
  }

  //* If remote branch was deleted, then delete local branch
  try {
    // 4. Delete local draft branch
    await git.deleteBranch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: versionToDelete.branch,
    });
  } catch (error) {
    console.debug(`[API/delete_draft] Error deleting draft`);
    return { status: "error", type: "UNKNOWN" };
  }

  // 5. Get new list of versions and return it
  const versionsResp = await list_versions({ repositoryId });
  if (versionsResp.status === "error") {
    return { status: "error", type: "UNKNOWN" };
  }
  return { status: "success", versions: versionsResp.versions };
}

//#endregion

//#region API: compare_versions
export type CompareVersionsParameters = {
  repositoryId: string;
  fromVersion: Version | "INITIAL";
  toVersion: Version;
};

export type CompareVersionsResponse =
  | {
      status: "success";
      diff: VersionContentComparison;
    }
  | {
      status: "error";
      type: "UNKNOWN";
    };

export async function compare_versions({
  repositoryId,
  fromVersion,
  toVersion,
}: CompareVersionsParameters): Promise<CompareVersionsResponse> {
  console.debug(
    `[API/compare_versions] Called with repositoryId=${repositoryId}, fromVersion=${fromVersion === "INITIAL" ? "INITIAL" : fromVersion.name}, toVersion=${toVersion.name}`,
  );

  try {
    const fromRef =
      fromVersion === "INITIAL"
        ? await gitdb.getInitialCommitOid({ repositoryId })
        : fromVersion.type === "published"
          ? fromVersion.tag
          : fromVersion.branch;

    const toRef =
      toVersion.type === "published" ? toVersion.tag : toVersion.branch;

    const diff = await gitdb.compareCommits({
      repositoryId,
      fromRef,
      toRef,
    });

    return { status: "success", diff };
  } catch (error) {
    console.debug(`[API/compare_versions] Error computing diff`);
    return { status: "error", type: "UNKNOWN" };
  }
}

//#endregion
