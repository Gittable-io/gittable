import {
  DraftVersion,
  RemoteDraftVersion,
  RepositoryCredentials,
} from "@sharedTypes/index";
import * as remoteService from "../services/git/remote";
import * as backupService from "../services/git/backup";
import { GitServiceError } from "../services/git/error";

//#region API: pull_new_draft
export type PullNewDraftParameters = {
  repositoryId: string;
  remoteDraftVersion: RemoteDraftVersion;
  credentials?: RepositoryCredentials;
};

export type PullNewDraftResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type:
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function pull_new_draft({
  repositoryId,
  remoteDraftVersion,
  credentials,
}: PullNewDraftParameters): Promise<PullNewDraftResponse> {
  console.debug(
    `[API/pull_new_draft] Called with repositoryId=${repositoryId}`,
  );

  let errorResponse: PullNewDraftResponse | null = null;
  try {
    // 1. Backup repository
    await backupService.backup(repositoryId);

    await remoteService.pull_new_draft({
      repositoryId,
      remoteDraftVersion,
      credentials,
    });
  } catch (error) {
    console.error(
      `[API/pull_new_draft] Error : ${error instanceof Error ? `${error.name}: ${error.message}` : ""}`,
    );

    if (error instanceof GitServiceError) {
      if (error.name === "NO_CREDENTIALS_PROVIDED") {
        errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
      } else if (error.name === "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS") {
        errorResponse = {
          status: "error",
          type: "AUTH_ERROR_WITH_CREDENTIALS",
        };
      } else {
        errorResponse = { status: "error", type: "UNKNOWN" };
      }
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    if (errorResponse) {
      await backupService.restore(repositoryId);
    } else {
      await backupService.clear(repositoryId);
    }
  }

  if (errorResponse) return errorResponse;

  return { status: "success" };
}

//#endregion

//#region API: pull_new_commits
export type PullNewCommitsParameters = {
  repositoryId: string;
  draftVersion: DraftVersion;
  credentials?: RepositoryCredentials;
};

export type PullNewCommitsResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type:
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function pull_new_commits({
  repositoryId,
  draftVersion,
  credentials,
}: PullNewCommitsParameters): Promise<PullNewCommitsResponse> {
  console.debug(
    `[API/pull_new_commits] Called with repositoryId=${repositoryId}`,
  );

  let errorResponse: PullNewDraftResponse | null = null;
  try {
    // 1. Backup repository
    await backupService.backup(repositoryId);

    await remoteService.pull_new_commits({
      repositoryId,
      draftVersion,
      credentials,
    });
  } catch (error) {
    console.error(
      `[API/pull_new_commits] Error : ${error instanceof Error ? `${error.name}: ${error.message}` : ""}`,
    );

    if (error instanceof GitServiceError) {
      if (error.name === "NO_CREDENTIALS_PROVIDED") {
        errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
      } else if (error.name === "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS") {
        errorResponse = {
          status: "error",
          type: "AUTH_ERROR_WITH_CREDENTIALS",
        };
      } else {
        errorResponse = { status: "error", type: "UNKNOWN" };
      }
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    if (errorResponse) {
      await backupService.restore(repositoryId);
    } else {
      await backupService.clear(repositoryId);
    }
  }

  if (errorResponse) return errorResponse;

  return { status: "success" };
}

//#endregion

//#region API: pull_deleted_draft
export type PullDeletedDraftParameters = {
  repositoryId: string;
  draftVersion: DraftVersion;
  credentials?: RepositoryCredentials;
};

export type PullDeletedDraftResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type:
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function pull_deleted_draft({
  repositoryId,
  draftVersion,
  credentials,
}: PullDeletedDraftParameters): Promise<PullDeletedDraftResponse> {
  console.debug(
    `[API/pull_deleted_draft] Called with repositoryId=${repositoryId}`,
  );

  let errorResponse: PullNewDraftResponse | null = null;
  try {
    // 1. Backup repository
    await backupService.backup(repositoryId);

    await remoteService.pull_deleted_draft({
      repositoryId,
      draftVersion,
      credentials,
    });
  } catch (error) {
    console.error(
      `[API/pull_deleted_draft] Error : ${error instanceof Error ? `${error.name}: ${error.message}` : ""}`,
    );

    if (error instanceof GitServiceError) {
      if (error.name === "NO_CREDENTIALS_PROVIDED") {
        errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
      } else if (error.name === "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS") {
        errorResponse = {
          status: "error",
          type: "AUTH_ERROR_WITH_CREDENTIALS",
        };
      } else {
        errorResponse = { status: "error", type: "UNKNOWN" };
      }
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    if (errorResponse) {
      await backupService.restore(repositoryId);
    } else {
      await backupService.clear(repositoryId);
    }
  }

  if (errorResponse) return errorResponse;

  return { status: "success" };
}

//#endregion
//#region API: pull_new_published_versions
export type PullNewPublishedVersionsParameters = {
  repositoryId: string;
  credentials?: RepositoryCredentials;
};

export type PullNewPublishedVersionsResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type:
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function pull_new_published_versions({
  repositoryId,
  credentials,
}: PullNewPublishedVersionsParameters): Promise<PullNewPublishedVersionsResponse> {
  console.debug(
    `[API/pull_new_published_versions] Called with repositoryId=${repositoryId}`,
  );

  let errorResponse: PullNewDraftResponse | null = null;
  try {
    // 1. Backup repository
    await backupService.backup(repositoryId);

    await remoteService.pull_new_published_versions({
      repositoryId,
      credentials,
    });
  } catch (error) {
    console.error(
      `[API/pull_new_published_versions] Error : ${error instanceof Error ? `${error.name}: ${error.message}` : ""}`,
    );

    if (error instanceof GitServiceError) {
      if (error.name === "NO_CREDENTIALS_PROVIDED") {
        errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
      } else if (error.name === "AUTH_FAILED_WITH_PROVIDED_CREDENTIALS") {
        errorResponse = {
          status: "error",
          type: "AUTH_ERROR_WITH_CREDENTIALS",
        };
      } else {
        errorResponse = { status: "error", type: "UNKNOWN" };
      }
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    if (errorResponse) {
      await backupService.restore(repositoryId);
    } else {
      await backupService.clear(repositoryId);
    }
  }

  if (errorResponse) return errorResponse;

  return { status: "success" };
}

//#endregion
