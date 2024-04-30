import fs from "node:fs/promises";
import git, { FetchResult, PushResult, ServerRef } from "isomorphic-git";
import http from "isomorphic-git/http/node";
import {
  PublishedVersion,
  RemoteRepositoryChanges,
  RepositoryCredentials,
} from "@sharedTypes/index";
import { UserDataStore } from "../../db";
import { getRepositoryPath } from "../../utils/utils";
import { GitServiceError } from "./error";
import * as gitService from "./local";
import * as gitUtils from "./utils";
import * as gitFuture from "./isomorphic-git-overrides";

//#region pushBranchOrTag
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

//#endregion

//#region fetch
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
      tags: true,
      prune: true,
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
//#endregion

//#region pull
export async function pull({
  repositoryId,
  credentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<RemoteRepositoryChanges> {
  // (A) Determine the changes in the remote repository. If there are GitServiceErrorType, they will be handled by the API function
  const remoteRepositoryChanges = await getRemoteRepositoryChanges({
    repositoryId,
    credentials,
  });
  const { newDraft, deletedDraft, newCommits, newPublishedVersions } =
    remoteRepositoryChanges;

  const currentVersion = await gitService.getCurrentVersion({ repositoryId });

  // (B) Before fetching, you may need to prepare the local repository
  // 1. If the checked out branch got deleted in remote, then switch temporarily to main
  // isomorphic-git's fetch() throws an error if you're on a branch that got deleted on remote
  if (
    deletedDraft &&
    currentVersion.type === "draft" &&
    currentVersion.name === deletedDraft.version.name
  ) {
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "main",
    });
  }

  // (C) Then fetch all changes from remote. If there are GitServiceErrorType, they will be handled by the API function
  await fetch({ repositoryId, credentials });

  // (D) After fetching, integrate the fetched remote changed into the local repository
  // 1. Integrate new commits : Merge on draft branch
  if (newCommits) {
    const draftVersion = newCommits.version;

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

  // 2. Integrate new draft branches : Create local branches
  if (newDraft) {
    await gitFuture.createLocalBranchFromRemoteBranch({
      repositoryId,
      branchName: newDraft.draftVersion.branch,
    });
  }

  // 3. Integrate new tags (new published versions) : merge origin/main with main
  if (newPublishedVersions) {
    await git.merge({
      fs,
      dir: getRepositoryPath(repositoryId),
      ours: "main",
      theirs: `refs/remotes/origin/main`,
    });
  }

  // 4. Integrate deleted draft branches : delete local branches
  if (deletedDraft) {
    // We assume that there's a single draft branch
    const deletedDraftVersion = deletedDraft.version;

    // If the user is on the deleted draft version, we need to switch to the last published version
    if (
      currentVersion.type === "draft" &&
      currentVersion.name === deletedDraftVersion.name
    ) {
      const lastPublishedVersion = await gitService.getLastPublishedVersion({
        repositoryId,
      });

      await git.checkout({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: lastPublishedVersion
          ? lastPublishedVersion.tag
          : await gitService.getInitialCommitOid({ repositoryId }),
      });
    }

    // Delete local branch
    // Remote branch is already deleted with git.fetch({prune:true})
    await gitFuture.deleteBranch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: deletedDraftVersion.branch,
    });
  }

  return remoteRepositoryChanges;
}
//#endregion

//#region getRemoteRepositoryChanges

async function getRemoteRepositoryChanges({
  repositoryId,
  credentials: providedCredentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<RemoteRepositoryChanges> {
  // (A) Fetch Server Refs
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
      peelTags: true,
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

  // (B) Determine remote repository changes from serverRefs
  const remoteRepoChanges: RemoteRepositoryChanges = {};

  const remoteDraftBrancheRefs: Array<ServerRef & { branchName: string }> =
    serverRefs
      .filter((ref) =>
        gitUtils.isBranchDraftVersion(ref.ref.slice("refs/heads/".length)),
      )
      .map((ref) => ({
        ...ref,
        branchName: ref.ref.slice("refs/heads/".length),
      }));

  const localDraftVersions = await gitService.getDraftVersions({
    repositoryId,
  });

  // 1. Determine new draft branches
  for (const remoteDraftBranchRef of remoteDraftBrancheRefs) {
    if (
      !localDraftVersions.find(
        (ldv) => ldv.branch === remoteDraftBranchRef.branchName,
      )
    ) {
      const { id, name } = gitUtils.getDraftBranchInfo(
        remoteDraftBranchRef.branchName,
      );
      remoteRepoChanges.newDraft = {
        draftVersion: {
          type: "draft",
          branch: remoteDraftBranchRef.branchName,
          id,
          name,
          headOid: remoteDraftBranchRef.oid,
        },
      };

      break; // We assume there's always a single new draft
    }
  }

  // 2. Determine new commits on existing draft branches
  for (const remoteDraftBranchRef of remoteDraftBrancheRefs) {
    const localDraftVersion = localDraftVersions.find(
      (ldv) => ldv.branch === remoteDraftBranchRef.branchName,
    );
    if (
      localDraftVersion &&
      localDraftVersion.headOid !== remoteDraftBranchRef.oid
    ) {
      remoteRepoChanges.newCommits = { version: localDraftVersion };

      break; // We assume there's always a single draft branch
    }
  }

  // 3. Determine deleted draft branches
  for (const draftVersion of localDraftVersions) {
    const localBranch = draftVersion.branch;
    if (
      !remoteDraftBrancheRefs.find(
        (remoteBranchRef) => remoteBranchRef.branchName === localBranch,
      )
    ) {
      remoteRepoChanges.deletedDraft = { version: draftVersion };
      break; // We assume there's always a single draft branch
    }
  }

  // 4. Determine new published versions
  const remoteTagsRefs: Array<ServerRef & { tagName: string }> = serverRefs
    .filter((ref) => ref.ref.startsWith("refs/tags/"))
    .map((ref) => ({
      ...ref,
      tagName: ref.ref.slice("refs/tags/".length),
    }));
  const localPublishedVersions = await gitService.getPublishedVersions({
    repositoryId,
  });

  const newPublishedVersions: {
    version: Pick<PublishedVersion, "type" | "name" | "tag" | "mainCommitOid">;
  }[] = [];

  for (const remoteTagRef of remoteTagsRefs) {
    if (
      !localPublishedVersions.find((lpv) => lpv.tag === remoteTagRef.tagName)
    ) {
      newPublishedVersions.push({
        version: {
          type: "published",
          name: remoteTagRef.tagName,
          tag: remoteTagRef.tagName,
          mainCommitOid: remoteTagRef.peeled!,
        },
      });
    }
  }
  if (newPublishedVersions.length > 0) {
    remoteRepoChanges.newPublishedVersions = newPublishedVersions;
  }

  // (C) Operation was successfull : If credentials were provided, then save those credentials
  if (providedCredentials) {
    await UserDataStore.setRepositoryCredentials(
      repositoryId,
      providedCredentials,
    );
  }

  // (D) Prepare return result
  return remoteRepoChanges;
}

//#endregion
