import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../utils/utils";

export type GetVersionsParameters = {
  repositoryId: string;
};

export type GetVersionsResponse =
  | {
      status: "success";
      versions: string[];
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_versions({
  repositoryId,
}: GetVersionsParameters): Promise<GetVersionsResponse> {
  console.debug(`[API/get_versions] Called with repositoryId=${repositoryId}`);

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
