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
