import fs from "node:fs/promises";
import git from "isomorphic-git";
import { getRepositoryPath } from "../utils/utils";
import {
  DraftVersion,
  PublishedVersion,
  RepositoryCredentials,
  Version,
  VersionContent,
} from "@sharedTypes/index";
import { get_current_version_content } from "./version";
import _ from "lodash";
import {
  AuthWithProvidedCredentialsError,
  NoCredentialsProvidedError,
  pushNewBranch,
} from "../utils/git/push";

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
    }
  | {
      status: "error";
      type: "HEAD does not point to a Tag";
    }
  | {
      status: "error";
      type: "unknown";
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
    return { status: "error", type: "unknown" };
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
    }
  | {
      status: "error";
      type: "unknown";
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

  try {
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
    };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(`[API/get_current_version] Error : ${error.name}`);
    } else {
      console.debug(`[API/get_current_version] Error`);
    }

    return { status: "error", type: "unknown" };
  }
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
    }
  | {
      status: "error";
      type: "unknown";
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
    const response = await get_current_version_content({ repositoryId });
    if (response.status === "error") throw new Error();

    return { status: "success", content: response.content };
  } catch (error) {
    if (error instanceof Error) {
      console.debug(
        `[API/switch_version] error.name=${error.name}, error.message=${error.message}`,
      );
    }

    return { status: "error", type: "unknown" };
  }
}
//#endregion

//#region API: create_draft
export type CreateDraftParameters = {
  repositoryId: string;
  name: string;
  credentials?: RepositoryCredentials;
};

export type CreateDraftResponse =
  | {
      status: "success";
      version: DraftVersion;
    }
  | {
      status: "error";
      type:
        | "VERSION_ALREADY_EXISTS"
        | "NO_PROVIDED_CREDENTIALS"
        | "AUTH_ERROR_WITH_CREDENTIALS"
        | "UNKNOWN";
    };

export async function create_draft({
  repositoryId,
  name: draftName,
  credentials,
}: CreateDraftParameters): Promise<CreateDraftResponse> {
  console.debug(
    `[API/create_draft] Called with repositoryId=${repositoryId} and name=${draftName}`,
  );

  const branchName = `draft/${draftName}`;

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
        type: "VERSION_ALREADY_EXISTS",
      };
    }

    // 1.2. Get the newest published version
    const latestPublishedVersion = await get_last_published_version({
      repositoryId,
    });

    // 1.3 Create a new branch from the newest published version

    await git.branch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: branchName,
      object: latestPublishedVersion.tag,
    });
    console.debug(`[API/create_draft] Created local branch`);
  } catch (error) {
    console.debug(`[API/create_draft] Error creating local branch`);
    return { status: "error", type: "UNKNOWN" };
  }

  let errorResponse: CreateDraftResponse | null = null;
  try {
    // 2. Push branch
    await pushNewBranch({ repositoryId, branchName, credentials });
  } catch (error) {
    console.debug(`[API/create_draft] Error pushing local branch`);
    if (error instanceof NoCredentialsProvidedError) {
      errorResponse = { status: "error", type: "NO_PROVIDED_CREDENTIALS" };
    } else if (error instanceof AuthWithProvidedCredentialsError) {
      errorResponse = { status: "error", type: "AUTH_ERROR_WITH_CREDENTIALS" };
    } else {
      errorResponse = { status: "error", type: "UNKNOWN" };
    }
  } finally {
    // If there's an error in pushing branch, delete created branch
    if (errorResponse) {
      console.debug(
        `[API/create_draft] Error pushing local branch: deleting local branch`,
      );
      await git.deleteBranch({
        fs,
        dir: getRepositoryPath(repositoryId),
        ref: branchName,
      });
    }
  }

  if (errorResponse) {
    console.debug(`[API/create_draft] Returning error`);
    return errorResponse;
  } else {
    // 3. Return newly created version
    console.debug(`[API/create_draft] Returning success`);
    return {
      status: "success",
      version: { type: "draft", name: draftName, branch: branchName },
    };
  }
}
//#endregion

//#region API: delete_draft
export type DeleteDraftParameters = {
  repositoryId: string;
  version: DraftVersion;
};

export type DeleteDraftResponse =
  | {
      status: "success";
      versions: Version[];
    }
  | {
      status: "error";
      type: "DRAFT VERSION OPENED";
    }
  | {
      status: "error";
      type: "DRAFT VERSION DO NOT EXIST";
    }
  | {
      status: "error";
      type: "unknown";
    };

export async function delete_draft({
  repositoryId,
  version,
}: DeleteDraftParameters): Promise<DeleteDraftResponse> {
  console.debug(
    `[API/delete_draft] Called with repositoryId=${repositoryId} and version=${JSON.stringify(version)}`,
  );

  try {
    // 1. Check that draft version exists
    const draftVersions = await list_draft_versions({ repositoryId });
    if (!draftVersions.find((dv) => _.isEqual(dv, version))) {
      return {
        status: "error",
        type: "DRAFT VERSION DO NOT EXIST",
      };
    }

    // 2. Check that we're not in actual draft version
    const currentVersionResp = await get_current_version({ repositoryId });
    if (currentVersionResp.status === "error") {
      return { status: "error", type: "unknown" };
    }
    if (_.isEqual(currentVersionResp.version, version)) {
      return {
        status: "error",
        type: "DRAFT VERSION OPENED",
      };
    }

    // 3. Delete draft version
    await git.deleteBranch({
      fs,
      dir: getRepositoryPath(repositoryId),
      ref: version.branch,
    });

    // 4. Get new list of versions and return it
    const versionsResp = await list_versions({ repositoryId });
    if (versionsResp.status === "error") {
      return { status: "error", type: "unknown" };
    }
    return { status: "success", versions: versionsResp.versions };
  } catch (error) {
    return { status: "error", type: "unknown" };
  }
}

//#endregion

//#region Helper functions
type ListPublishedVersionsParameters = {
  repositoryId: string;
};

type ListPublishedVersionsResponse = PublishedVersion[];

export async function list_published_versions({
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

type GetLastPublishedVersionParameters = {
  repositoryId: string;
};

type GetLastPublishedVersionResponse = PublishedVersion;

export async function get_last_published_version({
  repositoryId,
}: GetLastPublishedVersionParameters): Promise<GetLastPublishedVersionResponse> {
  console.debug(
    `[Help/get_last_published_versions] Called with repositoryId=${repositoryId}`,
  );

  const publishedVersions = await list_published_versions({ repositoryId });
  const latestPublishedVersion = publishedVersions.find((v) => v.newest);

  if (!latestPublishedVersion) throw new Error();

  return latestPublishedVersion;
}

type ListDraftVersionsParameters = {
  repositoryId: string;
};

type ListDraftVersionsResponse = DraftVersion[];

export async function list_draft_versions({
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
