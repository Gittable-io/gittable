import fs from "node:fs/promises";
import git, { ReadCommitResult } from "isomorphic-git";
import {
  Commit,
  DraftVersion,
  PublishedVersion,
  VersionContentComparison,
} from "@sharedTypes/index";
import { getRepositoryPath, getTableIdFromFileName } from "../utils";
import { gitUtils } from "./gitutils";

/**
 *
 * @returns an array of published versions, i.e. tags on the main branch.
 * Returns an empty array if there's no published versions (no tags)
 */
async function getPublishedVersions({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<PublishedVersion[]> {
  console.debug(
    `[gitdb/getPublishedVersions] Called with repositoryId=${repositoryId}`,
  );

  // 1. Get list of tags
  const tags = await git.listTags({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  // If there's no published versions, return an empty array
  if (tags.length === 0) return [];

  // 2. Loop over all tags and
  //      Determine which tag is the latest one
  //      Get the dates of each tag so that it can be sorted
  const mainCommitOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  const tagDates = new Map<string, number>();

  let newestTag: string | null = null;
  for (const tag of tags) {
    const tagCommitOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: tag,
    });

    const tagCommit = await git.readCommit({
      fs,
      dir: getRepositoryPath(repositoryId),
      oid: tagCommitOid,
    });

    if (tagCommitOid === mainCommitOid) {
      newestTag = tag;
    }

    tagDates.set(tag, tagCommit.commit.author.timestamp);
  }

  if (newestTag == null) {
    console.debug(
      `[API/list_published_versions] Could not determine latest or current version`,
    );
    throw new Error("Couldn't find the newest Published version");
  }

  tags.sort((a, b) => tagDates.get(b)! - tagDates.get(a)!);

  const versions: PublishedVersion[] = tags.map((tag) => ({
    type: "published",
    name: tag,
    tag: tag,
    newest: tag === newestTag,
  }));

  return versions;
}

/**
 *
 * @returns the last published version. i.e. the last tag on the main branch
 * return null if there are no published versions
 */
async function getLastPublishedVersion({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<PublishedVersion | null> {
  console.debug(
    `[gitdb/getLastPublishedVersion] Called with repositoryId=${repositoryId}`,
  );

  const publishedVersions = await getPublishedVersions({ repositoryId });
  if (publishedVersions.length === 0) return null;

  const latestPublishedVersion = publishedVersions.find((v) => v.newest);
  if (!latestPublishedVersion)
    throw new Error("No Published version was marked as newest");

  return latestPublishedVersion;
}

/**
 *
 * @returns the published version designated by the tag name.
 * Returns an empty array if there's no published versions that has the tag name
 */
async function getPublishedVersion({
  repositoryId,
  tagName,
}: {
  repositoryId: string;
  tagName: string;
}): Promise<PublishedVersion | null> {
  console.debug(
    `[gitdb/getPublishedVersion] Called with repositoryId=${repositoryId} and tagName=${tagName}`,
  );

  const publishedVersions = await getPublishedVersions({ repositoryId });

  const result = publishedVersions.find((v) => v.tag === tagName);

  return result ?? null;
}

async function getDraftVersionCommits({
  repositoryId,
  draftVersion,
}: {
  repositoryId: string;
  draftVersion: DraftVersion;
}): Promise<Commit[]> {
  // 1. Get the commit log from the branch HEAD to the branch base (excluding the branch base)
  const localLog: ReadCommitResult[] = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });

  const localBranchLog: ReadCommitResult[] = localLog.slice(
    0,
    localLog.findIndex((commit) => commit.oid === draftVersion.baseOid),
  );

  // 2. Check which commit is also in remote
  const remoteBranchLog: ReadCommitResult[] = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: `refs/remotes/origin/${draftVersion.branch}`,
  });

  const isCommitInRemote = (
    remoteBranchLog: ReadCommitResult[],
    localCommit: ReadCommitResult,
  ): boolean =>
    remoteBranchLog.findIndex((rcommit) => rcommit.oid === localCommit.oid) >=
    0;

  // 3. Convert ReadCommitResult object to Commit object
  const commits: Commit[] = localBranchLog.map((c) => ({
    oid: c.oid,
    message: c.commit.message,
    // ! Read https://stackoverflow.com/a/11857467/471461 for author.timestamp vs committer.timestamp
    author: c.commit.author,
    inRemote: isCommitInRemote(remoteBranchLog, c),
  }));

  return commits;
}

async function getDraftVersions({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<DraftVersion[]> {
  console.debug(
    `[gitdb/getDraftVersions] Called with repositoryId=${repositoryId}`,
  );

  // 1. Get list of branches
  const branches = await git.listBranches({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  // 2. Filter draft branches
  const draftBranches = branches.filter((b) => b.startsWith("draft/"));

  const versions: DraftVersion[] = [];

  for (const branch of draftBranches) {
    const baseOid = await gitUtils.getDraftBranchBaseOid({
      repositoryId,
      draftBranchName: branch,
    });

    const tagName = await gitUtils.getTagFromOid({
      repositoryId,
      commitOid: baseOid,
    });

    if (!tagName) {
      versions.push({
        type: "draft",
        branch: branch,
        name: branch.slice(6),
        baseOid,
        basePublishedVersion: "INITIAL",
      });
    } else {
      const basePublishedVersion = await getPublishedVersion({
        repositoryId,
        tagName,
      });

      if (!basePublishedVersion) {
        throw new Error(
          `Cannot retreive base published version of draft ${branch} `,
        );
      }

      versions.push({
        type: "draft",
        branch: branch,
        name: branch.slice(6),
        baseOid,
        basePublishedVersion,
      });
    }
  }

  return versions;
}

/**
 *
 * @returns the draft version designated by the branch name.
 * Returns an empty array if there's no draft versions with the branch name
 */
async function getDraftVersion({
  repositoryId,
  branch,
}: {
  repositoryId: string;
  branch: string;
}): Promise<DraftVersion | null> {
  console.debug(
    `[gitdb/getDraftVersion] Called with repositoryId=${repositoryId} and branch=${branch}`,
  );

  const draftVersions = await getDraftVersions({ repositoryId });

  const result = draftVersions.find((v) => v.branch === branch);

  return result ?? null;
}

async function getInitialCommitOid({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<string> {
  console.debug(
    `[gitdb/getInitialCommitOid] Called with repositoryId=${repositoryId}`,
  );

  const mainLog = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  const initialCommit = mainLog[mainLog.length - 1];
  if (initialCommit.commit.message !== "INITIAL_COMMIT") {
    throw new Error("Coudln't find initial commit");
  }

  return initialCommit.oid;
}

/**
 *
 * @returns if the repository is empty. i.e. it has just been created in the Git server and this is the first clone
 * We determine that a repository is empty when it doesn't have any branch
 */
async function isRepositoryEmpty({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
  console.debug(
    `[gitdb/isRepositoryEmpty] Called with repositoryId=${repositoryId}`,
  );

  const branches = await git.listBranches({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  if (branches.length === 0) return true;
  else return false;
}

/**
 *
 * @returns if the repository is initial. i.e. it doesn't have any published versions and a single draft version
 */
async function isRepositoryInitial({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
  console.debug(
    `[gitdb/isRepositoryInitial] Called with repositoryId=${repositoryId}`,
  );

  const publishedVersions = await getPublishedVersions({ repositoryId });

  if (publishedVersions.length === 0) return true;
  else return false;
}

async function compareCommits({
  repositoryId,
  fromRef,
  toRef,
}: {
  repositoryId: string;
  fromRef: string;
  toRef: string | "WORKDIR";
}): Promise<VersionContentComparison> {
  const treeFrom = git.TREE({ ref: fromRef });
  const treeTo = toRef === "WORKDIR" ? git.WORKDIR() : git.TREE({ ref: toRef });

  // Using walk to traverse commits
  const walkResult: {
    filepath: string;
    diff: "modified" | "deleted" | "added";
  }[] = await git.walk({
    fs,
    dir: getRepositoryPath(repositoryId),
    trees: [treeFrom, treeTo],
    map: async function (filepath, [fromEntry, toEntry]) {
      if (filepath.startsWith(".git")) return null;

      if (!fromEntry || !toEntry) {
        return { filepath, diff: fromEntry ? "deleted" : "added" };
      } else {
        const fromOid = await fromEntry.oid();
        const toOid = await toEntry.oid();
        if (fromOid !== toOid) {
          return { filepath, diff: "modified" };
        } else {
          return null;
        }
      }
    },
  });

  const result: VersionContentComparison = walkResult
    .filter((r) => r.filepath !== ".")
    .map((r) => ({
      table: {
        id: getTableIdFromFileName(r.filepath),
        name: getTableIdFromFileName(r.filepath),
      },
      diff: r.diff,
    }));

  return result;
}

export const gitdb = {
  getDraftVersionCommits,
  getPublishedVersions,
  getPublishedVersion,
  getLastPublishedVersion,
  getDraftVersions,
  getDraftVersion,
  getInitialCommitOid,
  isRepositoryEmpty,
  isRepositoryInitial,
  compareCommits,
};
