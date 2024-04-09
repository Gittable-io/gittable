import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../utils/utils";
import {
  DraftVersion,
  PublishedVersion,
  Version,
  VersionContent,
} from "@sharedTypes/index";
import { get_checked_out_content } from "./version";

//#region API: list_versions
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
    const publishedVersions: PublishedVersion[] = await list_published_versions(
      { repositoryId },
    );
    const draftVersions: DraftVersion[] = await list_draft_versions({
      repositoryId,
    });

    const versions: Version[] = [...draftVersions, ...publishedVersions];

    return { status: "success", versions };
  } catch (error) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
//#endregion

//#region API: get_current_version
export type GetCurrentVersionParameters = {
  repositoryId: string;
};

export type GetCurrentVersionResponse =
  | {
      status: "success";
      version: Version;
    }
  | {
      status: "error";
      type: "COULD NOT FIND CURRENT VERSION";
      message: "Could not find current version";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function get_current_version({
  repositoryId,
}: GetCurrentVersionParameters): Promise<GetCurrentVersionResponse> {
  console.debug(
    `[API/get_current_version] Called with repositoryId=${repositoryId}`,
  );

  /*
   * Here's the algorithm to know on which version I am :
   *
   * Check if git HEAD is pointing to a current branch or in a detached HEAD mode
   *     If HEAD points to the current branch => I'm on a draft version
   *     If Detached HEAD => I'm on a Tag
   *
   * This works, because, in the App, HEAD can only point to a Branch or to a Tag. There's no other options
   */

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

  const headCommitOid = await git.resolveRef({
    fs,
    dir: getRepositoryPath(repositoryId),
    ref: "HEAD",
  });

  if (headStatus === "POINTS_TO_BRANCH") {
    const draftVersions = await list_draft_versions({ repositoryId });

    // Even though, there's only a single draft, we will verify that HEAD points to it (in the future, we will have multiple drafts)
    for (const version of draftVersions) {
      const branchCommitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: version.branch,
      });

      if (branchCommitOid === headCommitOid) {
        return { status: "success", version };
      }
    }
  } else {
    const publishedVersions = await list_published_versions({ repositoryId });

    for (const version of publishedVersions) {
      const tagCommitOid = await git.resolveRef({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: version.tag,
      });

      if (tagCommitOid === headCommitOid) {
        return { status: "success", version };
      }
    }
  }

  return {
    status: "error",
    type: "COULD NOT FIND CURRENT VERSION",
    message: "Could not find current version",
  };
}
//#endregion

//#region API: switch_version
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

/**
 * Switches HEAD to a version
 *  - If version is a Draft version: it switches to a branch
 *  - If version is a Published version: it switches to a Tag
 *
 * If switching from a Draft version, and there are changes in the working dir, they are discarded
 *
 * @returns
 */
export async function switch_version({
  repositoryId,
  version,
}: SwitchVersionParameters): Promise<SwitchVersionResponse> {
  console.debug(
    `[API/switch_version] Called with repositoryId=${repositoryId} and version=${JSON.stringify(version)}`,
  );
  try {
    // 0. Discard changes in the working dir
    // * I could've verified first that Working dir != local repository, but for now, I'm doing a discard in all cases
    // TODO: In the future : stash before switching from a draft and reapply stash when switching back
    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      force: true, // If I remove force:true, discard doesn't work
    });

    // 1. Switch to branch or tag
    const ref = version.type === "published" ? version.tag : version.branch;

    await git.checkout({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref,
    });

    // 2. Get the new content and return it
    const response = await get_checked_out_content({ repositoryId });
    if (response.status === "error") throw new Error();

    return { status: "success", content: response.content };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/switch_version] error.name=${error.name}, error.message=${error.message}`,
      );
    }

    return { status: "error", type: "unknown", message: "Unknown error" };
  }
}
//#endregion

//#region API: create_draft
export type CreateDraftParameters = {
  repositoryId: string;
  name: string;
};

export type CreateDraftResponse =
  | {
      status: "success";
      version: DraftVersion;
    }
  | {
      status: "error";
      type: "VERSION ALREADY EXISTS";
      message: "Version already exists";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function create_draft({
  repositoryId,
  name: draftName,
}: CreateDraftParameters): Promise<CreateDraftResponse> {
  console.debug(
    `[API/create_draft] Called with repositoryId=${repositoryId} and name=${draftName}`,
  );

  try {
    // 1. Create branch
    // 1.1. First check that a version of the same name is not already created
    const response = await list_versions({ repositoryId });
    if (response.status === "error") {
      throw new Error();
    }

    const versions = response.versions;
    const versionExists = versions.some((v) => v.name === draftName);
    if (versionExists) {
      console.debug(`[API/create_draft] Version already exists`);
      return {
        status: "error",
        type: "VERSION ALREADY EXISTS",
        message: "Version already exists",
      };
    }

    // 1.2. Get the newest published version
    const publishedVersions = versions.filter(
      (v) => v.type === "published",
    ) as PublishedVersion[];
    const latestPublishedVersion = publishedVersions.find((v) => v.newest)!;

    // 1.3 Create a new branch from the newest published version
    const branchName = `draft/${draftName}`;
    await git.branch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: branchName,
      object: latestPublishedVersion.name,
    });
    // 2. Push branch

    // 3. Return newly created version
    return {
      status: "success",
      version: { type: "draft", name: draftName, branch: branchName },
    };
  } catch (error) {
    return { status: "error", type: "unknown", message: "Unknown error" };
  } finally {
    // If there's an error in pushing branch, delete created branch
  }
}
//#endregion

//#region Helper functions
type ListPublishedVersionsParameters = {
  repositoryId: string;
};

type ListPublishedVersionsResponse = PublishedVersion[];

async function list_published_versions({
  repositoryId,
}: ListPublishedVersionsParameters): Promise<ListPublishedVersionsResponse> {
  console.debug(
    `[Help/list_published_versions] Called with repositoryId=${repositoryId}`,
  );

  // 1. Get list of tags
  const tags = await git.listTags({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

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
    throw new Error();
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

type ListDraftVersionsParameters = {
  repositoryId: string;
};

type ListDraftVersionsResponse = DraftVersion[];

async function list_draft_versions({
  repositoryId,
}: ListDraftVersionsParameters): Promise<ListDraftVersionsResponse> {
  console.debug(
    `[Help/list_draft_versions] Called with repositoryId=${repositoryId}`,
  );

  // 1. Get list of branches
  const branches = await git.listBranches({
    fs,
    dir: getRepositoryPath(repositoryId),
  });

  // 2. Filter draft branches
  const draftBranches = branches.filter((b) => b.startsWith("draft/"));

  const versions: DraftVersion[] = draftBranches.map((branch) => ({
    type: "draft",
    branch: branch,
    name: branch.slice(6),
  }));

  return versions;
}

//#endregion
