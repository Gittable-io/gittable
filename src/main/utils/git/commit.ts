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
  const log: ReadCommitResult[] = await git.log({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: draftVersion.branch,
  });

  // Only return the log from the HEAD of the branch to the last published tag
  const lastPublishedVersion: PublishedVersion =
    await get_last_published_version({ repositoryId });
  const lastPublishedVersionOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: lastPublishedVersion.tag,
  });

  const branchLog: ReadCommitResult[] = log.slice(
    0,
    log.findIndex((commit) => commit.oid === lastPublishedVersionOid),
  );

  // Convert ReadCommitResult object to Commit object
  const commits: Commit[] = branchLog.map((r) => ({
    oid: r.oid,
    message: r.commit.message,
    // ! Read https://stackoverflow.com/a/11857467/471461 for author.timestamp vs committer.timestamp
    author: r.commit.author,
  }));

  return commits;
}
