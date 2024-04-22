import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../../utils/utils";

/**
 *
 * @returns the commit oid of the starting point of the draft branch (when it branched from main)
 */
export async function getDraftBranchBaseOid({
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

export function getDraftBranchInfo(branchName: string): {
  id: string;
  name: string;
} {
  if (!branchName.startsWith("draft/")) {
    throw new Error(`${branchName} is not a draft branch`);
  }

  const parts: string[] = branchName.split("/");
  if (parts.length < 3 || parts[2] === "") {
    throw new Error(`${branchName} has an illegal draft branch name`);
  }

  const id = parts[1];
  const name = branchName.slice(parts[0].length + parts[1].length + 2);

  return { id, name };
}

export async function generateDraftBranch(name: string): Promise<string> {
  // ! I'm doing a dynamic import of nanoid, to solve a difficult ERR_REQUIRE_ESM error
  // ! when importing nanoid
  // ! There are other solutions, one of them is downgrading to nanoid v3
  // ! see https://github.com/ai/nanoid?tab=readme-ov-file#install
  // ! see https://stackoverflow.com/a/73191957/471461
  //
  const { nanoid } = await import("nanoid");

  const id = nanoid();
  return `draft/${id}/${name}`;
}
