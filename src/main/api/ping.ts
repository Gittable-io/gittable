import fs from "node:fs/promises";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

export type PingResponse = { status: "success"; message: "pong" };

export async function ping(): Promise<PingResponse> {
  console.log("Main: Received Ping from Renderer");
  return { status: "success", message: "pong" };
}

export async function test(): Promise<void> {
  console.log("[API/test] called");

  const pushResult = await git.push({
    fs,
    http,
    dir: "C:\\Users\\hhour\\Desktop\\git-test\\empty-repo",
    ref: "v1.0",
    onAuth: () => {
      return { username: "habib", password: "habib" };
    },
    onAuthFailure: () => {
      console.log("[API/test] onAuthFailure");
    },
  });

  console.log(JSON.stringify(pushResult));
}
