/*
 * This file contains overrides to or new isomorphic-git functions, that at one time, I should add them to the isomorphic-git
 * project with a PR
 */

import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../../utils/utils";

/**
 *
 * This function is used when we fetch a new remote branch and we need to create a new local branch that tracks it
 *
 * it is the equivalent of
 *  git branch --track my-local-branch origin/my-remote-branch
 *
 * We can achieve the same behavior by
 * 1. Checking out the remote branch => isogit creates automatically the local branch
 * 2. But we still need to config manually the upstream branches
 *
 */
export async function createLocalBranchFromRemoteBranch({
  repositoryId,
  branchName,
}: {
  repositoryId: string;
  branchName: string;
}): Promise<void> {
  const remoteBranchHeadOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: `refs/remotes/origin/${branchName}`,
  });

  await git.writeRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: `refs/heads/${branchName}`,
    value: remoteBranchHeadOid,
  });
  await git.setConfig({
    fs,
    dir: getRepositoryPath(repositoryId),
    path: `branch.${branchName}.remote`,
    value: "origin",
  });
  await git.setConfig({
    fs,
    dir: getRepositoryPath(repositoryId),
    path: `branch.${branchName}.merge`,
    value: `refs/heads/${branchName}`,
  });
}

/**
 *
 * This function tries to replicate "git branch -d", which isomorphic-git deleteBranch() doesn't implement it exactly like Git
 *
 * The issue is, that isogit deletes the ref to the branch, but does not delete the upstream-branch config in the config file
 * which is the behavior of git branch -d
 *
 * TODO: do a PR in isomorphic git
 */
export async function deleteBranch(
  options: Parameters<typeof git.deleteBranch>[0],
): ReturnType<typeof git.deleteBranch> {
  // Delete the branch ref
  await git.deleteBranch(options);

  // Missing: delete the upstream-branch config
  const branch_merge = await git.getConfig({
    fs: options.fs,
    dir: options.dir,
    path: `branch.${options.ref}.merge`,
  });
  if (branch_merge) {
    await git.setConfig({
      fs: options.fs,
      dir: options.dir,
      path: `branch.${options.ref}.merge`,
      value: undefined,
    });
  }

  const branch_remote = await git.getConfig({
    fs: options.fs,
    dir: options.dir,
    path: `branch.${options.ref}.remote`,
  });
  if (branch_remote) {
    await git.setConfig({
      fs: options.fs,
      dir: options.dir,
      path: `branch.${options.ref}.remote`,
      value: undefined,
    });
  }
}

/**
 *
 * This functions implements "git branch -d -r" which deleted remote-tracking branches (refs to remote branches), but keeps local branches
 * This features does not exist yet in isogit's deleteBranch()
 *
 * Note: it exists with isogit's fetch({prune:true}), but I would like to delete the remote branch ref without fetching (as I already know that it was deleted)
 *
 * In the future, try to add a remote parameter to isogit deleteBranch()
 *
 * TODO: do a PR in isomorphic git
 */
export async function deleteRemoteTrackingBranch(
  options: Parameters<typeof git.deleteBranch>[0],
): ReturnType<typeof git.deleteBranch> {
  const remoteRef = `refs/remotes/origin/${options.ref}`;

  await git.deleteRef({
    ...options,
    ref: remoteRef,
  });
}
