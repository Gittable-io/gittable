import fs from "node:fs/promises";
import path from "node:path";
import { getConfig } from "../../config";
import { getRepositoryPath } from "../../utils/utils";

export async function backup(repositoryId: string): Promise<void> {
  const original: string = getRepositoryPath(repositoryId);
  const backup: string = getBackupRepositoryPath(repositoryId);

  await fs.mkdir(backup);
  await cp(original, backup);
}

export async function restore(repositoryId: string): Promise<void> {
  const original: string = getRepositoryPath(repositoryId);
  const backup: string = getBackupRepositoryPath(repositoryId);

  await fs.rm(original, { recursive: true, force: true });
  await fs.rename(backup, original);
}

export async function clear(repositoryId: string): Promise<void> {
  const backup: string = getBackupRepositoryPath(repositoryId);
  await fs.rm(backup, { recursive: true, force: true });
}

//#region Helper functions
function getBackupRepositoryPath(repositoryId: string): string {
  const backupFolderName = `${repositoryId}_backup`;
  const dest = path.join(getConfig().dir.repositories, backupFolderName);

  return dest;
}

/**
 * Helper function to recursively copy a directory.
 * Since fs.cp() is still experimental, I did not use it (see https://nodejs.org/api/fs.html#fspromisescpsrc-dest-options)
 * Instead, I got this code from https://github.com/nodejs/node/issues/44598
 */
const cp = async (source: string, destination: string): Promise<void> => {
  const filesToCreate = await fs.readdir(source);
  for (const file of filesToCreate) {
    const originalFilePath = path.join(source, file);
    const stats = await fs.stat(originalFilePath);
    if (stats.isFile()) {
      const writePath = path.join(destination, file);
      await fs.copyFile(originalFilePath, writePath);
    } else if (stats.isDirectory()) {
      await fs.mkdir(path.join(destination, file));
      await cp(path.join(source, file), path.join(destination, file));
    }
  }
};

//#endregion
