import fs from "node:fs/promises";
import git, { FetchResult, PushResult } from "isomorphic-git";
import http from "isomorphic-git/http/node";
import { RepositoryCredentials } from "@sharedTypes/index";
import { UserDataStore } from "../../db";
import { getRepositoryPath } from "../../utils/utils";
import { GitServiceError } from "./error";

export async function pushBranchOrTag({
  repositoryId,
  branchOrTagName,
  credentials: providedCredentials,
  deleteBranch = false,
}: {
  repositoryId: string;
  branchOrTagName: string;
  credentials?: RepositoryCredentials;
  deleteBranch?: boolean;
}): Promise<void> {
  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    throw new GitServiceError("NO_CREDENTIALS_PROVIDED");
  }

  let pushResult: PushResult | null = null;
  try {
    // Push branch
    pushResult = await git.push({
      fs,
      http,
      dir: getRepositoryPath(repositoryId),
      ref: branchOrTagName,
      delete: deleteBranch,
      onAuth: () => {
        return credentials;
      },
      onAuthFailure: () => {
        return { cancel: true };
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "UserCanceledError") {
        // This only occurs when I cancelled push with onAuthFailure
        throw new GitServiceError("AUTH_FAILED_WITH_PROVIDED_CREDENTIALS");
      } else {
        throw new GitServiceError(
          "UNKNOWN_REMOTE_OPERATION_ERROR",
          `${error.name}: ${error.message}`,
        );
      }
    } else {
      throw new GitServiceError("UNKNOWN_REMOTE_OPERATION_ERROR");
    }
  }

  // After Push finished, check if there was an error
  if (!pushResult || pushResult.error) {
    throw new GitServiceError(
      "UNKNOWN_REMOTE_OPERATION_ERROR",
      "Push succeeded but with errors",
    );
  }

  // Push was successfull
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }
  return;
}

export async function fetch({
  repositoryId,
  credentials: providedCredentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<FetchResult> {
  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    throw new GitServiceError("NO_CREDENTIALS_PROVIDED");
  }

  let fetchResult: FetchResult | null = null;

  try {
    // Push branch
    fetchResult = await git.fetch({
      fs,
      http,
      dir: getRepositoryPath(repositoryId),
      onAuth: () => {
        return credentials;
      },
      onAuthFailure: () => {
        return { cancel: true };
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "UserCanceledError") {
        // This only occurs when I cancelled push with onAuthFailure
        throw new GitServiceError("AUTH_FAILED_WITH_PROVIDED_CREDENTIALS");
      } else {
        throw new GitServiceError(
          "UNKNOWN_REMOTE_OPERATION_ERROR",
          `${error.name}: ${error.message}`,
        );
      }
    } else {
      throw new GitServiceError("UNKNOWN_REMOTE_OPERATION_ERROR");
    }
  }

  // Fetch was successfull
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }

  return fetchResult;
}
