import { readdir, readFile, writeFile, copyFile as copyFileFs, mkdir, rename, unlink } from "fs/promises";
import { existsSync } from "fs";
import { resolve, parse, ParsedPath } from "path";
import { Logger } from "./logger";
import getFrontMatter, { FrontMatterResult } from "front-matter";
import { exec } from "child_process";
import readline from "readline";

export async function* getFiles(dir: string): AsyncGenerator<{ path: string; isDir: boolean }, any, unknown> {
  const dirents = await readdir(dir, { withFileTypes: true });
  for (const dirent of dirents) {
    const path = resolve(dir, dirent.name);
    yield { path, isDir: dirent.isDirectory() };
    if (dirent.isDirectory()) {
      yield* getFiles(path);
    }
  }
}

export function getFileExtension(filename: string) {
  return filename.split(".").pop();
}

export async function getFileContents(filepath: string) {
  return readFile(filepath, "utf-8");
}

export function removeFileExtension(path: string) {
  return path.substring(0, path.lastIndexOf(".")) || path;
}

export function dirExists(dirpath: string) {
  return existsSync(dirpath);
}

export async function saveFile(filepath: string, data: string) {
  await writeFile(filepath, data);
}

export async function copyFile(src: string, dest: string) {
  await copyFileFs(src, dest);
}

export async function deleteFile(filepath: string) {
  await unlink(filepath);
}

export async function createDir(dirpath: string) {
  await mkdir(dirpath, { recursive: true });
}

export async function renameDir(oldDirpath: string, newDirpath: string) {
  await rename(oldDirpath, newDirpath);
}

export function renderFrontMatter<T extends Record<string, unknown>, K extends FrontMatterResult<T>>(fronMatter: K) {
  const fm = ["---", ...Object.entries(fronMatter.attributes).map(([k, v]) => `${k}: ${v ?? ""}`), "---"].join("\n");
  return fm + "\n" + fronMatter.body;
}

export async function updateFrontMatter<T extends Record<string, unknown>>(
  filepath: string,
  { dbg }: Logger,
  dryRun: boolean,
  callback: (fm: FrontMatterResult<T>, fileInfo: ParsedPath) => void
) {
  // trimStart should be used to remove accidental whitespaces that break front-matter
  const fm = getFrontMatter<T>((await getFileContents(filepath)).trimStart());
  const newFm = callback(fm, parse(filepath));
  if (newFm != null) {
    dbg(`Updating file: ${filepath}`);
    if (!dryRun) {
      await saveFile(filepath, renderFrontMatter(newFm));
    }
  }
}

export function updateText(data: string, callback: (line: string) => string | false | void) {
  const output: string[] = [];
  const matches = data.matchAll(/(.*)(\r?(\n|$))/g);
  if (matches != null) {
    for (const match of matches) {
      if (match[0] === "") {
        // EndOfFile. This is a side-effect of the regext
        continue;
      }
      const res = callback(match[1]);
      if (res === false) {
        // Discard this line, i.e. don't do anything
      } else if (res != null) {
        // Save the updated line with the original line-ending
        output.push(res + match[2]);
      } else {
        // Save the original line
        output.push(match[0]);
      }
    }
  }
  return output.join("");
}

export async function walkNotes(llbDirpath: string, callback: (path: string) => Promise<any>) {
  for await (const { path, isDir } of getFiles(llbDirpath)) {
    if (!isDir && getFileExtension(path) === "md") {
      await callback(path);
    }
  }
}

export function isProcessRunning(query: string, cb: (status: boolean) => void) {
  const platform = process.platform;
  let cmd = "";
  switch (platform) {
    case "win32":
      cmd = `tasklist`;
      break;
    case "darwin":
      cmd = `ps -ax | grep ${query}`;
      break;
    case "linux":
      cmd = `ps -A`;
      break;
    default:
      break;
  }
  exec(cmd, (_, stdout, __) => {
    cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
  });
}

export async function ensureObisidanIsNotRunning(ignoreObsidianRunning: boolean, { warn }: Logger) {
  return new Promise<void>((r, j) => {
    isProcessRunning("obsidian", (status) => {
      if (status) {
        const message =
          "WARNING: Obsidian seems to be running! It's highly advised to exit it first.\nProceed the update? [y/N] ";
        if (ignoreObsidianRunning) {
          warn(`${message} (yes: overridden)`);
          r();
        } else {
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
          });

          rl.question(message, (answer) => {
            if (answer == "y") {
              rl.close();
              r();
            } else {
              j(new Abort("Cancelled"));
            }
          });
        }
      }
    });
  });
}

export class Abort extends Error {}
