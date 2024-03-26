import { UserDataStore } from "../../db";

export type GetGitConfigReponse = {
  status: "success";
  gitConfig: {
    user: { name: string; email: string };
  };
};

export async function get_git_config(): Promise<GetGitConfigReponse> {
  console.debug(`[API/get_git_config] Called`);

  const gitConfig = (await UserDataStore.getUserData()).git;
  return { status: "success", gitConfig };
}
