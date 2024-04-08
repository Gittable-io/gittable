import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath, getTableNameFromFileName } from "../utils/utils";
import { TableMetadata, Version, VersionContent } from "@sharedTypes/index";
import { getConfig } from "../config";

export type ListVersionsParameters = {
  repositoryId: string;
};

export type ListVersionsResponse =
  | {
      status: "success";
      versions: Version[];
    }
  | {
      status: "error";
      type: "COULD NOT DETERMINE LATEST VERSION";
      message: "Could not determine latest version";
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

export async function list_versions({
  repositoryId,
}: ListVersionsParameters): Promise<ListVersionsResponse> {
  console.debug(`[API/list_versions] Called with repositoryId=${repositoryId}`);

  try {
    // 1. Get list of tags
    console.debug(`[API/list_versions] Get list of tags`);
    const tags = await git.listTags({
      fs,
      dir: getRepositoryPath(repositoryId),
    });

    // 2. Determine which tag is the latest one & which one is the current one
    console.debug(
      `[API/list_versions] Determine which tag is the latest one & which one is the current one`,
    );

    const mainCommitOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "main",
    });

    const headCommitOid = await git.resolveRef({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: "HEAD",
    });

    let newestTag: string | null = null;
    let currentTag: string | null = null;
    for (const tag of tags) {
      const tagCommitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: tag,
      });

      if (tagCommitOid === mainCommitOid) {
        newestTag = tag;
      }
      if (tagCommitOid === headCommitOid) {
        currentTag = tag;
      }

      if (newestTag != null && currentTag != null) {
        break;
      }
    }

    if (newestTag == null) {
      console.debug(
        `[API/list_versions] Could not determine latest or current version`,
      );

      return {
        status: "error",
        type: "COULD NOT DETERMINE LATEST VERSION",
        message: "Could not determine latest version",
      };
    }

    if (currentTag == null) {
      console.debug(`[API/list_versions] HEAD does not point to a Tag`);

      return {
        status: "error",
        type: "HEAD does not point to a Tag",
        message: "HEAD does not point to a Tag",
      };
    }

    const versions: Version[] = tags.map((tag) => ({
      type: "published",
      name: tag,
      newest: tag === newestTag,
      current: tag === currentTag,
    }));

    console.debug(`[API/list_versions] Success. Sending versions`);
    return { status: "success", versions };
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

export type SwitchVersionParameters = {
  repositoryId: string;
  version: Version;
};

export type SwitchVersionResponse =
  | {
      status: "success";
      content: VersionContent;
    }
  | {
      status: "error";
      type: "Cannot find version";
      message: "Cannot find version";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function switch_version({
  repositoryId,
  version,
}: SwitchVersionParameters): Promise<SwitchVersionResponse> {
  console.debug(
    `[API/switch_version] Called with repositoryId=${repositoryId} and version=${JSON.stringify(version)}`,
  );
  try {
    if (version.type === "published") {
      // 1. Make sure the tag exists
      const tags = await git.listTags({
        fs,
        dir: getRepositoryPath(repositoryId),
      });

      if (!tags.includes(version.name)) {
        return {
          status: "error",
          type: "Cannot find version",
          message: "Cannot find version",
        };
      }

      // 2. Checkout the tag
      await git.checkout({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: version.name,
      });

      // 3. Get the current content
      const response = await get_checked_out_content({ repositoryId });
      if (response.status === "error") throw new Error();

      return { status: "success", content: response.content };
    } else {
      return {
        status: "error",
        type: "Cannot find version",
        message: "Cannot find version",
      };
    }
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/switch_version] error.name=${error.name}, error.message=${error.message}`,
      );
    }

    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
