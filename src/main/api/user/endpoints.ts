import { UserDataStore } from "../../db";

export type GetGitConfigReponse = {
  status: "success";
  gitConfig: {
    user: { name: string; email: string };
  };
};

export async function get_git_config(): Promise<GetGitConfigReponse> {
  console.debug(`[API/user] get_git_config Called`);

  const gitConfig = (await UserDataStore.getUserData()).git;
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

  try {
    await UserDataStore.setGitUserConfig(
      gitConfig.user.name,
      gitConfig.user.email,
    );

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      type: "unknown",
      message: "Unknown error",
    };
  }
}
