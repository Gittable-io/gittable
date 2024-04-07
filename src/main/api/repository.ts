import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath, getTableNameFromFileName } from "../utils/utils";
import { TableMetadata, VersionContent } from "@sharedTypes/index";
import { getConfig } from "../config";

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

export type GetCheckedOutVersionParameters = {
  repositoryId: string;
};

export type GetCheckedOutVersionResponse =
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

export async function get_checked_out_version({
  repositoryId,
}: GetCheckedOutVersionParameters): Promise<GetCheckedOutVersionResponse> {
  console.debug(
    `[API/get_checked_out_version] Called with repositoryId=${repositoryId}`,
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

export type GetCheckedOutContentParameters = {
  repositoryId: string;
};

export type GetCheckedOutContentResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_checked_out_content({
  repositoryId,
}: GetCheckedOutContentParameters): Promise<GetCheckedOutContentResponse> {
  console.debug(
    `[API/get_checked_out_content] Called with repositoryId=${repositoryId}`,
  );

  try {
    const [FILE, _HEAD, _WORKDIR] = [0, 1, 2];
    const tables: TableMetadata[] = (
      await git.statusMatrix({
        fs,
        dir: getRepositoryPath(repositoryId),
        filter: (f) => f.endsWith(getConfig().fileExtensions.table),
      })
    ).map((tableStatus) => ({
      id: tableStatus[FILE] as string,
      name: getTableNameFromFileName(tableStatus[FILE] as string),
    }));

    return {
      status: "success",
      content: { tables },
    };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
