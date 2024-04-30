import git, { ServerRef } from "isomorphic-git";
import http from "isomorphic-git/http/node";

export type PingResponse = { status: "success"; message: "pong" };

export async function ping(): Promise<PingResponse> {
  console.log("Main: Received Ping from Renderer");
  return { status: "success", message: "pong" };
}

export async function test(): Promise<void> {
  console.log("[API/test] called");

  let serverRefs: ServerRef[] | null = null;
  try {
    serverRefs = await git.listServerRefs({
      http,
      url: "http://localhost:3000/habib/dev-repo-2t-1d.git",
      onAuth: () => {
        console.log("Needs authentication");
      },
      onAuthFailure: () => {
        console.error("Authentication failure");
      },
      onAuthSuccess: () => {
        console.log("Authentication success");
      },
    });
  } catch (error) {
    console.error(`Error: ${JSON.stringify(error)}`);
  }

  console.log(`Server Refs: ${JSON.stringify(serverRefs)}`);
}
