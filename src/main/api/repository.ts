import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../utils/utils";

export type ListVersionsParameters = {
  repositoryId: string;
};

export type ListVersionsResponse =
  | {
      status: "success";
      versions: string[];
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function list_versions({
  repositoryId,
}: ListVersionsParameters): Promise<ListVersionsResponse> {
  console.debug(`[API/list_versions] Called with repositoryId=${repositoryId}`);

  try {
    const tags = await git.listTags({
      fs,
      dir: getRepositoryPath(repositoryId),
    });

    return { status: "success", versions: tags };
  } catch (error) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

export type CurrentVersionParameters = {
  repositoryId: string;
};

export type CurrentVersionResponse =
  | {
      status: "success";
      version: string;
    }
  | {
      status: "error";
      type: "HEAD does not point to a Tag";
      message: "HEAD does not point to a Tag";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function current_version({
  repositoryId,
}: CurrentVersionParameters): Promise<CurrentVersionResponse> {
  console.debug(
    `[API/current_version] Called with repositoryId=${repositoryId}`,
  );

  try {
    // 1. Get the commitOid referenced by HEAD
    const headCommitOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "HEAD",
    });

    // 2. For each tagged version, check which one is equal to HEAD
    const tags = await git.listTags({
      fs,
      dir: getRepositoryPath(repositoryId),
    });

    for (const tag of tags) {
      const tagCommitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: tag,
      });

      if (tagCommitOid === headCommitOid) {
        return { status: "success", version: tag };
      }
    }

    return {
      status: "error",
      type: "HEAD does not point to a Tag",
      message: "HEAD does not point to a Tag",
    };
  } catch (error) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
