import fs from "node:fs/promises";
import git, { ReadCommitResult, ReadTagResult } from "isomorphic-git";
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

  // If there's no tags, return an empty array
  if (tags.length === 0) return [];

  // 2. Get the annotated tag objects for each tag
  const annotatedTags: ReadTagResult[] = [];
  for (const tag of tags) {
    const tagOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: tag,
    });

    const tagObject = await git.readTag({
      fs,
      dir: getRepositoryPath(repositoryId),
      oid: tagOid,
    });

    annotatedTags.push(tagObject);
  }

  // 3. Sort annotated tags by date
  annotatedTags.sort((tagA, tagB) => {
    const utcTimestampA =
      tagA.tag.tagger.timestamp - tagA.tag.tagger.timezoneOffset * 60;
    const utcTimestampB =
      tagB.tag.tagger.timestamp - tagB.tag.tagger.timezoneOffset * 60;

    return utcTimestampB - utcTimestampA;
  });

  /*
   Get the main commit Oid, so that I can determine the newest tag
   Note : why am I not determinaing the newest tag by the tag date?
   I could, but it may be more future-proof if I look instead at the tag position on main
   Maybe, there will be a feature where I modify the tag. 
  */
  const mainCommitOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "main",
  });

  const publishedVersions: PublishedVersion[] = annotatedTags.map((tag) => ({
    type: "published",
    name: tag.tag.tag,
    tag: tag.tag.tag,
    mainCommitOid: tag.tag.object,
    newest: tag.tag.object === mainCommitOid,
  }));

  if (publishedVersions.filter((v) => v.newest).length !== 1) {
    console.debug(
      `[gitdb/getPublishedVersions] Couldn't determine the newest Published version`,
    );
    throw new Error(
      "[gitdb/getPublishedVersions] Couldn't determine the newest Published version",
    );
  }

  return publishedVersions;
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
    throw new Error(
      "[gitdb/getLastPublishedVersion] No Published version was marked as newest",
    );

  return latestPublishedVersion;
}

/**
 *
 * @returns the published version designated by the tag name.
 * Returns an empty array if there's no published versions that has the tag name
 *
 * TODO: This function is no longer used as of 17/04/2024. Delete it if it's still not used
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

  // 3. Map each branch to a DraftVersion
  const draftVersions: DraftVersion[] = [];
  const publishedVersion = await getPublishedVersions({ repositoryId });
  for (const branch of draftBranches) {
    // Get the draft version base Oid
    const baseOid = await gitUtils.getDraftBranchBaseOid({
      repositoryId,
      draftBranchName: branch,
    });

    const initialCommitOid = await getInitialCommitOid({ repositoryId });

    // Get the draft version basePublishedVersion
    const basePublishedVersion: PublishedVersion | "INITIAL" | undefined =
      baseOid === initialCommitOid
        ? "INITIAL"
        : publishedVersion.find((pv) => pv.mainCommitOid === baseOid);

    if (!basePublishedVersion) {
      throw new Error(
        `[gitdb/getDraftVersions] Could not determine the base published version of ${branch}`,
      );
    }

    draftVersions.push({
      type: "draft",
      branch: branch,
      name: branch.slice(6),
      baseOid,
      basePublishedVersion,
    });
  }

  return draftVersions;
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
  //! Git adds automatically a /n to commit messages. Be careful how you read commit messages
  if (!initialCommit.commit.message.startsWith("INITIAL_COMMIT")) {
    throw new Error("Coudln't find initial commit");
  }

  return initialCommit.oid;
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

/**
 *
 * @returns if the repository is initialized.
 * A non-initialized repository has just been created in the Git server and this is the first clone
 * We determine that a repository is non-initialized when it doesn't have any branch (not even a main)
 */
async function isRepositoryInitialized({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
  console.debug(
    `[gitdb/isRepositoryInitialized] Called with repositoryId=${repositoryId}`,
  );

  const branches = await git.listBranches({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  return branches.length > 0;
}

/**
 *
 * @returns if the repository has a published version.
 */
async function hasPublished({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
  console.debug(
    `[gitdb/hasPublished] Called with repositoryId=${repositoryId}`,
  );

  const publishedVersions = await getPublishedVersions({ repositoryId });

  return publishedVersions.length > 0;
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
    change: "modified" | "deleted" | "added";
  }[] = await git.walk({
    fs,
    dir: getRepositoryPath(repositoryId),
    trees: [treeFrom, treeTo],
    map: async function (filepath, [fromEntry, toEntry]) {
      if (filepath.startsWith(".git")) return null;

      if (!fromEntry || !toEntry) {
        return { filepath, change: fromEntry ? "deleted" : "added" };
      } else {
        const fromOid = await fromEntry.oid();
        const toOid = await toEntry.oid();
        if (fromOid !== toOid) {
          return { filepath, change: "modified" };
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
      change: r.change,
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
  isRepositoryInitialized,
  hasPublished,
  compareCommits,
};
