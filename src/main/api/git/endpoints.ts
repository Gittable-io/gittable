import fs from "node:fs/promises";
import path from "node:path";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";

const dir = path.join("C:/Users/hhour/Desktop/projects/gittable/test-repo");

export function git_clone(): void {
  console.log("Main: Received git_clone from Renderer");

  git
    .clone({
      fs,
      http,
      dir,
      url: "http://localhost:3100/habib/repo1.git",
    })
    .then(console.log)
    .then(() => "cloned");
}

export function git_status(): void {
  console.log("Main: Received git_status from Renderer");
  git.status({ fs, dir, filepath: "test.txt" }).then(console.log);
}

export function git_add(): void {
  console.log("Main: Received git_add from Renderer");
  git.add({ fs, dir, filepath: "test.txt" }).then(console.log);
}

export function git_commit(): void {
  console.log("Main: Received git_commit from Renderer");
  git
    .commit({
      fs,
      dir,
      message: `Test commit ${Date.now()}`,
      author: { name: "habib", email: "h.hourany@gmail.com" },
    })
    .then(console.log);
}

export function git_push(): void {
  console.log("Main: Received git_push from Renderer");
  git
    .push({
      fs,
      http,
      dir,
      remote: "origin",
      ref: "main",
      onAuth: () => ({ username: "habib", password: "habib" }),
    })
    .then(console.log);
}
