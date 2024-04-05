import fs from "node:fs/promises";
import git from "isomorphic-git";
import { GitConfig, UserDataStore } from "../../db";
import { list_repositories } from "../repository";
import { getRepositoryPath } from "../../utils/utils";
import * as EmailValidator from "email-validator";

export type GetGitConfigReponse = {
  status: "success";
  gitConfig: GitConfig;
};

export async function get_git_config(): Promise<GetGitConfigReponse> {
  console.debug(`[API/user] get_git_config Called`);

  const gitConfig = await UserDataStore.getGitConfig();
  return { status: "success", gitConfig };
}

export type SaveGitConfigParameters = {
  gitConfig: {
    user: { name: string; email: string };
  };
};

export type SaveGitConfigResponse =
  | {
      status: "success";
      gitConfig: {
        user: { name: string; email: string };
      };
    }
  | {
      status: "error";
      type: "Invalid user.name";
      message: "Git config user.name is empty or invalid";
    }
  | {
      status: "error";
      type: "Invalid user.email";
      message: "Git config user.email is empty or invalid";
    }
  | {
      status: "error";
      type: "unknown";
      message: "Unknown error";
    };

export async function save_git_config({
  gitConfig,
}: SaveGitConfigParameters): Promise<SaveGitConfigResponse> {
  console.debug(`[API/user] save_git_config: gitConfig=${gitConfig}`);

  // Validation
  if (gitConfig.user.name.trim() === "") {
    return {
      status: "error",
      type: "Invalid user.name",
      message: "Git config user.name is empty or invalid",
    };
  } else if (
    gitConfig.user.email.trim() === "" ||
    !EmailValidator.validate(gitConfig.user.email)
  ) {
    return {
      status: "error",
      type: "Invalid user.email",
      message: "Git config user.email is empty or invalid",
    };
  }

  const currentGitConfig = await UserDataStore.getGitConfig();

  try {
    if (
      gitConfig.user.name !== currentGitConfig.user.name ||
      gitConfig.user.email !== currentGitConfig.user.email
    ) {
      await UserDataStore.setGitUserConfig(
        gitConfig.user.name,
        gitConfig.user.email,
      );

      // Modify the Git config of all existing local repositories
      const repositories = (await list_repositories()).repositories;
      for (const repo of repositories) {
        const repositoryPath = getRepositoryPath(repo.id);
        await git.setConfig({
          fs,
          dir: repositoryPath,
          path: "user.name",
          value: gitConfig.user.name,
        });
        await git.setConfig({
          fs,
          dir: repositoryPath,
          path: "user.email",
          value: gitConfig.user.email,
        });
      }
    }
    return { status: "success", gitConfig };
  } catch (error) {
    return {
      status: "error",
      type: "unknown",
      message: "Unknown error",
    };
  }
}
