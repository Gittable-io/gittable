import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getConfig } from "../config";
import { TableMetadataWithStatus, VersionContent } from "@sharedTypes/index";
import { getRepositoryPath, getTableNameFromFileName } from "../utils/utils";

//#region API: get_checked_out_content
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
    const [FILE, HEAD, WORKDIR] = [0, 1, 2];
    const tables: TableMetadataWithStatus[] = (
      await git.statusMatrix({
        fs,
        dir: getRepositoryPath(repositoryId),
        filter: (f) => f.endsWith(getConfig().fileExtensions.table),
      })
    ).map((tableStatus) => ({
      id: tableStatus[FILE] as string,
      name: getTableNameFromFileName(tableStatus[FILE] as string),
      modified: tableStatus[HEAD] !== tableStatus[WORKDIR],
    }));

    return {
      status: "success",
      content: { tables },
    };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

//#endregion

//#region API: discard_changes
export type DiscardChangesParameters = {
  repositoryId: string;
};

export type DiscardChangesResponse =
  | {
      status: "success";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function discard_changes({
  repositoryId,
}: DiscardChangesParameters): Promise<DiscardChangesResponse> {
  console.debug(
    `[API/discard_changes] Called with repositoryId=${repositoryId}`,
  );

  try {
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      force: true, // If I remove force:true, discard doesn't work
    });
    return { status: "success" };
  } catch (err) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}

//#endregion
