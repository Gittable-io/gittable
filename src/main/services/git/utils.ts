import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../../utils/utils";

/**
 *
 * @returns the commit oid of the starting point of the draft branch (when it branched from main)
 */
async function getDraftBranchBaseOid({
  repositoryId,
  draftBranchName,
}: {
  repositoryId: string;
  draftBranchName: string;
}): Promise<string> {
  const branchHeadCommitOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftBranchName,
  });

  const mainHeadCommitOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  const branchBaseOid = (await git.findMergeBase({
    fs,
    dir: getRepositoryPath(repositoryId),
    oids: [branchHeadCommitOid, mainHeadCommitOid],
  })) as string[];
  // TODO: isogit doesn't seem to document or type well the findMergeBase() function
  // TODO: modify isogit so that findMergeBase() is better typed

  return branchBaseOid[0];
}

export const gitUtils = {
  getDraftBranchBaseOid,
};
