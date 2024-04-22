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

export function isBranchDraftVersion(branchName: string): boolean {
  return (
    branchName.startsWith("draft/") &&
    branchName.includes("_") &&
    !branchName.endsWith("_")
  );
}

export function getDraftBranchInfo(branchName: string): {
  id: string;
  name: string;
} {
  if (!branchName.startsWith("draft/")) {
    throw new Error(`${branchName} is not a draft branch`);
  }
  if (!branchName.includes("_")) {
    throw new Error(`${branchName} has an illegal draft branch name`);
  }
  if (branchName.endsWith("_")) {
    throw new Error(`${branchName} has an illegal draft branch name`);
  }

  const startIdIdx = branchName.lastIndexOf("_") + 1;
  const id = branchName.slice(startIdIdx);
  const name = branchName.slice("draft/".length, startIdIdx - 1);

  return { id, name };
}

/**
 * Generate a draft branch name from the given version name.
 * The draft branch name is of format "draft/<name>_<id>"
 *
 * Some notes :
 * - In the previous version, the branch name was of the format : "draft/<id>/<name>"
 *   However, I noticed an issue with isomorphic-git:
 *   With a branch named "draft/<id>/<name>", isomorphic-git (and Git) creates a ref in
 *   .git/refs/heads/draft/<id>.
 *   However, when I tell isomorphic-git to delete the reference, it only deletes the <name> file,
 *   leaving .git/refs/heads/draft/<id> as empty folders.
 *   I was afraid, that with time, we will have many empty folders in .git/refs/heads/draft, so this is why I switched
 *   to the format "draft/<name>_<id>"
 *   The issue will still be present if users creates draft with names like "feat/xxx", but there will be less empty folders
 *   than having a folder for each <id>
 *
 *   TODO: modify isomorphic-git so that it cleanups empty folders in refs
 *
 */
export async function generateDraftBranch(name: string): Promise<string> {
  // ! I'm doing a dynamic import of nanoid, to solve a difficult ERR_REQUIRE_ESM error
  // ! when importing nanoid
  // ! There are other solutions, one of them is downgrading to nanoid v3
  // ! see https://github.com/ai/nanoid?tab=readme-ov-file#install
  // ! see https://stackoverflow.com/a/73191957/471461
  //
  const { customAlphabet } = await import("nanoid");

  const alphabet =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const nanoid = customAlphabet(alphabet, 20);
  const id = nanoid();

  return `draft/${name}_${id}`;
}
