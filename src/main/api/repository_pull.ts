import { RepositoryCredentials } from "@sharedTypes/index";
import * as remoteService from "../services/git/remote";
import * as backupService from "../services/git/backup";
import { GitServiceError } from "../services/git/error";

//#region API: pull_new_draft
export type PullNewDraftParameters = {
  repositoryId: string;
  remoteDraftRef: string;
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
  remoteDraftRef,
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
      remoteDraftRef,
      credentials,
    });
  } catch (error) {
    console.error(
      `[API/pull] Error : ${error instanceof Error ? `${error.name}: ${error.message}` : ""}`,
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
