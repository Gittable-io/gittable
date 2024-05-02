import fs from "node:fs/promises";
import git, { ReadCommitResult, ReadTagResult } from "isomorphic-git";
import {
  Commit,
  DraftVersion,
  PublishedVersion,
  Version,
  VersionContentComparison,
} from "@sharedTypes/index";
import { getRepositoryPath, getTableIdFromFileName } from "../../utils/utils";
import * as gitUtils from "./utils";
import { GitServiceError } from "./error";

/**
 *
 * @returns an array of published versions, i.e. tags on the main branch.
 * Returns an empty array if there's no published versions (no tags)
 */
export async function getPublishedVersions({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<PublishedVersion[]> {
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

  const publishedVersions: PublishedVersion[] = annotatedTags.map(
    (tag, idx) => ({
      type: "published",
      name: tag.tag.tag,
      tag: tag.tag.tag,
      mainCommitOid: tag.tag.object,
      annotatedTagOid: tag.oid,
      newest: idx === 0, // The newest tag is the first one (array is sorted anti-chronologically)
    }),
  );

  return publishedVersions;
}

/**
 *
 * @returns the last published version. i.e. the last tag on the main branch
 * return null if there are no published versions
 */
export async function getLastPublishedVersion({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<PublishedVersion | null> {
  const publishedVersions = await getPublishedVersions({ repositoryId });
  if (publishedVersions.length === 0) return null;

  const latestPublishedVersion = publishedVersions.find((v) => v.newest);
  if (!latestPublishedVersion)
    throw new Error(
      "[local/getLastPublishedVersion] No Published version was marked as newest",
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
export async function getPublishedVersion({
  repositoryId,
  tagName,
}: {
  repositoryId: string;
  tagName: string;
}): Promise<PublishedVersion | null> {
  const publishedVersions = await getPublishedVersions({ repositoryId });

  const result = publishedVersions.find((v) => v.tag === tagName);

  return result ?? null;
}

export async function getDraftVersions({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<DraftVersion[]> {
  // 1. Get list of branches
  const branches = await git.listBranches({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  // 2. Filter draft branches
  const draftBranches = branches.filter(gitUtils.isBranchDraftVersion);

  // 3. Map each branch to a DraftVersion
  const draftVersions: DraftVersion[] = [];
  const publishedVersion = await getPublishedVersions({ repositoryId });
  for (const branch of draftBranches) {
    // Get the draft version id and name
    const { id, name } = gitUtils.getDraftBranchInfo(branch);

    // Get the commit Oid pointed to by the branch
    const headOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: branch,
    });

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
        `[local/getDraftVersions] Could not determine the base published version of ${branch}`,
      );
    }

    draftVersions.push({
      type: "draft",
      id,
      branch: branch,
      name,
      headOid,
      baseOid,
      basePublishedVersion,
    });
  }

  return draftVersions;
}

export async function getCurrentVersion({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<Version> {
  // Check where HEAD is pointing at
  const currentBranch = await git.currentBranch({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  const headStatus: "POINTS_TO_BRANCH" | "POINTS_TO_TAG" = currentBranch
    ? "POINTS_TO_BRANCH"
    : "POINTS_TO_TAG";

  console.debug(
    `[API/get_current_version] HEAD status is ${headStatus}, and current branch is ${currentBranch}`,
  );

  /*
    HEAD will either point to : 
      - The commit oid referenced by the branch ref
      - The Annotated tag oid (not the commit pointed to by this tag)
  */
  const headOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "HEAD",
  });

  if (headStatus === "POINTS_TO_BRANCH") {
    const draftVersions = await getDraftVersions({
      repositoryId,
    });

    // Even though, there's only a single draft, we will verify that HEAD points to it (in the future, we will have multiple drafts)
    for (const version of draftVersions) {
      const branchCommitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: version.branch,
      });

      if (branchCommitOid === headOid) {
        return version;
      }
    }
  } else {
    const publishedVersions = await getPublishedVersions({
      repositoryId,
    });

    /*
    Note : in cases where mutliple tags points to the same commit (published versions with no commit)
    It will work, as HEAD points to the annotated tag and not to the commit referenced by the annotated tag 
    */
    for (const version of publishedVersions) {
      if (version.annotatedTagOid === headOid) {
        return version;
      }
    }
  }

  throw new GitServiceError("COULD_NOT_FIND_CURRENT_VERSION");
}

/**
 *
 * @returns the draft version designated by the branch name.
 * Returns an empty array if there's no draft versions with the branch name
 */
export async function getDraftVersion({
  repositoryId,
  branch,
}: {
  repositoryId: string;
  branch: string;
}): Promise<DraftVersion | null> {
  const draftVersions = await getDraftVersions({ repositoryId });

  const result = draftVersions.find((v) => v.branch === branch);

  return result ?? null;
}

export async function getInitialCommitOid({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<string> {
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

export async function getDraftVersionCommits({
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
export async function isRepositoryInitialized({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
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
export async function hasPublished({
  repositoryId,
}: {
  repositoryId: string;
}): Promise<boolean> {
  const publishedVersions = await getPublishedVersions({ repositoryId });

  return publishedVersions.length > 0;
}

export async function compareCommits({
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

  // It seems that if there's no difference, git.walk() returns undefined
  if (walkResult) {
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
  } else {
    return [];
  }
}
