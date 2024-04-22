import fs from "node:fs/promises";
import git, { FetchResult, PushResult, ServerRef } from "isomorphic-git";
import http from "isomorphic-git/http/node";
import {
  DraftVersion,
  RepositoryChange,
  RepositoryCredentials,
} from "@sharedTypes/index";
import { UserDataStore } from "../../db";
import { getRepositoryPath } from "../../utils/utils";
import { GitServiceError } from "./error";
import * as gitService from "./local";
import * as gitUtils from "./utils";
import * as gitFuture from "./isomorphic-git-overrides";

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

type RemoteRepositoryChange =
  | {
      type: "NEW_DRAFT";
      draftVersion: Pick<
        DraftVersion,
        "type" | "id" | "name" | "branch" | "headOid"
      >;
    }
  | {
      type: "NEW_COMMITS_ON_EXISTING_DRAFT";
      version: DraftVersion;
    };

export async function getRemoteRepositoryChanges({
  repositoryId,
  credentials: providedCredentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<RemoteRepositoryChange[]> {
  // Retrieve credentials, and return error if there are no credentials
  const credentials =
    providedCredentials ??
    (await UserDataStore.getRepositoryCredentials(repositoryId));
  if (credentials == null) {
    throw new GitServiceError("NO_CREDENTIALS_PROVIDED");
  }

  const repositoryUrl = (await UserDataStore.getRepository(repositoryId))
    .remoteUrl;
  let serverRefs: ServerRef[] | null = null;
  try {
    serverRefs = await git.listServerRefs({
      http,
      url: repositoryUrl,
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

  // =============== Determine remote repository changes from serverRefs
  const remoteRepositoryChanges: RemoteRepositoryChange[] = [];

  // 1. Determine new draft branches
  const remoteDraftBrancheRefs = serverRefs.filter((ref) =>
    ref.ref.startsWith("refs/heads/draft"),
  );

  const localDraftVersions = await gitService.getDraftVersions({
    repositoryId,
  });
  for (const remoteDraftBrancheRef of remoteDraftBrancheRefs) {
    const remoteBranch = remoteDraftBrancheRef.ref.slice("refs/heads/".length);
    if (!localDraftVersions.find((ldv) => ldv.branch === remoteBranch)) {
      const { id, name } = gitUtils.getDraftBranchInfo(remoteBranch);
      remoteRepositoryChanges.push({
        type: "NEW_DRAFT",
        draftVersion: {
          type: "draft",
          branch: remoteBranch,
          id,
          name,
          headOid: remoteDraftBrancheRef.oid,
        },
      });
    }
  }

  // 2. Determine new commits on existing draft branches
  for (const remoteDraftBrancheRef of remoteDraftBrancheRefs) {
    const remoteBranch = remoteDraftBrancheRef.ref.slice("refs/heads/".length);
    const localDraftVersion = localDraftVersions.find(
      (ldv) => ldv.branch === remoteBranch,
    );
    if (
      localDraftVersion &&
      localDraftVersion.headOid !== remoteDraftBrancheRef.oid
    ) {
      remoteRepositoryChanges.push({
        type: "NEW_COMMITS_ON_EXISTING_DRAFT",
        version: localDraftVersion,
      });
    }
  }

  // Operation was successfull
  // If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }

  return remoteRepositoryChanges;
}

export async function pull({
  repositoryId,
  credentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<RepositoryChange[]> {
  // First, determine the changes in the remote repository. If there are GitServiceErrorType, they will be handled by the API function
  const remoteRepositoryChanges = await getRemoteRepositoryChanges({
    repositoryId,
    credentials,
  });

  // Then fetch all changes from remote. If there are GitServiceErrorType, they will be handled by the API function
  await fetch({ repositoryId, credentials });

  // 1. Handle new commits on existing branches
  function isNewCommitsOnExistingDraft(
    change: RemoteRepositoryChange,
  ): change is Extract<
    RemoteRepositoryChange,
    { type: "NEW_COMMITS_ON_EXISTING_DRAFT" }
  > {
    return change.type === "NEW_COMMITS_ON_EXISTING_DRAFT";
  }

  const newCommitsChanges = remoteRepositoryChanges.filter(
    isNewCommitsOnExistingDraft,
  );

  if (newCommitsChanges.length > 0) {
    // We assume that there's a single draft branch
    const change = newCommitsChanges[0];
    const draftVersion = change.version;

    await git.merge({
      fs,
      dir: getRepositoryPath(repositoryId),
      ours: draftVersion.branch,
      theirs: `refs/remotes/origin/${draftVersion.branch}`,
    });

    // If the user is on the draft version, they need to checkout to complete the merge
    // If the user is on a published version, it doesn't seem to need that
    const currentVersion = await gitService.getCurrentVersion({ repositoryId });
    if (
      currentVersion.type === "draft" &&
      currentVersion.name === draftVersion.name
    ) {
      await git.checkout({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: draftVersion.branch,
      });
    }
  }

  // 2. Handle new draft branches
  function isNewDraft(
    change: RemoteRepositoryChange,
  ): change is Extract<RemoteRepositoryChange, { type: "NEW_DRAFT" }> {
    return change.type === "NEW_DRAFT";
  }

  const newDraftChanges = remoteRepositoryChanges.filter(isNewDraft);
  if (newDraftChanges.length > 0) {
    // We assume that there's a single draft branch
    const change = newDraftChanges[0];

    await gitFuture.createLocalBranchFromRemoteBranch({
      repositoryId,
      branchName: change.draftVersion.branch,
    });
  }

  return [];
}
