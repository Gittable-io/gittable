import fs from "node:fs/promises";
import git, { FetchResult, PushResult, ServerRef } from "isomorphic-git";
import http from "isomorphic-git/http/node";
import {
  DraftVersion,
  RemoteDraftVersion,
  RemotePublishedVersion,
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

//#region getRemoteRepositoryChanges

export async function getRemoteRepositoryChanges({
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

  const newPublishedVersions: RemotePublishedVersion[] = [];

  for (const remoteTagRef of remoteTagsRefs) {
    if (
      !localPublishedVersions.find((lpv) => lpv.tag === remoteTagRef.tagName)
    ) {
      newPublishedVersions.push({
        type: "published",
        name: remoteTagRef.tagName,
        tag: remoteTagRef.tagName,
        mainCommitOid: remoteTagRef.peeled!,
        annotatedTagOid: remoteTagRef.oid,
      });
    }
  }
  if (newPublishedVersions.length > 0) {
    remoteRepoChanges.newPublishedVersions = { versions: newPublishedVersions };
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

//#region fetch
async function fetch({
  repositoryId,
  credentials: providedCredentials,
  fetchOptions,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
  fetchOptions?: Partial<Parameters<typeof git.fetch>[0]>;
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
      ...fetchOptions,
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

//#region pull_new_draft
export async function pull_new_draft({
  repositoryId,
  remoteDraftVersion,
  credentials,
}: {
  repositoryId: string;
  remoteDraftVersion: RemoteDraftVersion;
  credentials?: RepositoryCredentials;
}): Promise<void> {
  const currentVersion = await gitService.getCurrentVersion({ repositoryId });
  if (currentVersion.type === "draft")
    throw new GitServiceError(
      "ILLEGAL_PULL_OPERATION",
      "You should be on a published version to pull a new draft version",
    );

  await fetch({
    repositoryId,
    credentials,
    fetchOptions: { singleBranch: true, remoteRef: remoteDraftVersion.branch },
  });

  await gitFuture.createLocalBranchFromRemoteBranch({
    repositoryId,
    branchName: remoteDraftVersion.branch,
  });
}
//#endregion

//#region pull_new_commits
export async function pull_new_commits({
  repositoryId,
  draftVersion,
  credentials,
}: {
  repositoryId: string;
  draftVersion: DraftVersion;
  credentials?: RepositoryCredentials;
}): Promise<void> {
  const currentVersion = await gitService.getCurrentVersion({ repositoryId });
  if (!gitUtils.isVersionEqual(currentVersion, draftVersion))
    throw new GitServiceError(
      "ILLEGAL_PULL_OPERATION",
      "You should be on the draft version to pull the new commits",
    );

  await fetch({
    repositoryId,
    credentials,
    fetchOptions: { singleBranch: true, ref: draftVersion.branch },
  });

  await git.merge({
    fs,
    dir: getRepositoryPath(repositoryId),
    ours: draftVersion.branch,
    theirs: `refs/remotes/origin/${draftVersion.branch}`,
  });

  await git.checkout({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });
}
//#endregion

//#region pull_deleted_draft
export async function pull_deleted_draft({
  repositoryId,
  draftVersion,
}: {
  repositoryId: string;
  draftVersion: DraftVersion;
  credentials?: RepositoryCredentials;
}): Promise<void> {
  const currentVersion = await gitService.getCurrentVersion({ repositoryId });
  if (!gitUtils.isVersionEqual(currentVersion, draftVersion))
    throw new GitServiceError(
      "ILLEGAL_PULL_OPERATION",
      "You should be on the draft version to pull the deleted branch",
    );

  // 1. Get out of the draft version to the last published version
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

  // Delete local branch
  await gitFuture.deleteBranch({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });

  await gitFuture.deleteRemoteTrackingBranch({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });
}
//#endregion

//#region pull_new_published_versions
export async function pull_new_published_versions({
  repositoryId,
  credentials,
}: {
  repositoryId: string;
  credentials?: RepositoryCredentials;
}): Promise<void> {
  const currentVersion = await gitService.getCurrentVersion({ repositoryId });
  if (currentVersion.type !== "published")
    throw new GitServiceError(
      "ILLEGAL_PULL_OPERATION",
      "You cannot be on a draft to pull a new published version",
    );

  // 1. Checkout to main
  await git.checkout({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  // 2. Fetch new commits on main and new tags
  /*
  Here I'm fetching tags and all branches.
  I tried, but I couldn't make it work to fetch only "main" and tags on "main"
    - I tried with {singleBranch:true, ref:"main", tags: true} => but {tags:true} doesn't work with {singleBranch:true}
    - I tried with {tags:true, exclude:[ref to draft branch]} => but it corrupted the .git folder
    - It also seems that "git fetch --tags" also fetches tags on all branches

  So for now, I am fetching everything in order to be able to fetch tags.
  
  The side-effect is that I can have remote draft branches in my local repo. but for now, it doesn't seem to cause problems
  */
  await fetch({
    repositoryId,
    credentials,
    fetchOptions: { tags: true },
  });

  // 3. Merge origin/main with main
  await git.merge({
    fs,
    dir: getRepositoryPath(repositoryId),
    ours: "main",
    theirs: `refs/remotes/origin/main`,
  });

  // 4. Checkout to main to complete the merge
  await git.checkout({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  // 5. Return to the published version you were in previously
  await git.checkout({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: currentVersion.tag,
  });
}
//#endregion
