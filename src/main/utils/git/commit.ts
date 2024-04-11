import fs from "node:fs/promises";
import git, { ReadCommitResult } from "isomorphic-git";
import { Commit, DraftVersion, PublishedVersion } from "@sharedTypes/index";
import { get_last_published_version } from "../../api/repository";
import { getRepositoryPath } from "../utils";

export async function getDraftVersionCommits({
  repositoryId,
  draftVersion,
}: {
  repositoryId: string;
  draftVersion: DraftVersion;
}): Promise<Commit[]> {
  // 1. Get the commit log from the branch HEAD to the oid of the last published version
  const localLog: ReadCommitResult[] = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });

  const lastPublishedVersion: PublishedVersion =
    await get_last_published_version({ repositoryId });
  const lastPublishedVersionOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: lastPublishedVersion.tag,
  });

  const localBranchLog: ReadCommitResult[] = localLog.slice(
    0,
    localLog.findIndex((commit) => commit.oid === lastPublishedVersionOid),
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
