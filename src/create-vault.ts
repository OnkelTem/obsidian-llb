import { relative, extname, dirname, basename, join, resolve } from "path";
import Mustache from "mustache";
import { Lang } from "./const";
import { Logger } from "./logger";
import { copyFile, createDir, dirExists, getFileContents, getFiles, removeFileExtension, saveFile } from "./utils";

const MUSTACHE_EXT = ".mustache";

type CreateVaultProps = {
  lang: Lang;
  vaultTemplatesDirpath: string;
  vaultDirpath: string;
  scriptFilename: string;
  scriptSourceFilepathTemplate: string;
  scriptStubFilename: string;
  debug: boolean;
  logger: Logger;
};

export async function createVault({
  lang,
  vaultTemplatesDirpath,
  vaultDirpath,
  scriptFilename,
  scriptSourceFilepathTemplate,
  scriptStubFilename,
  debug = false,
  logger,
}: CreateVaultProps) {
  const { dbg, log, err } = logger;
  try {
    const vaultTemplateDirpath = join(__dirname, "..", vaultTemplatesDirpath, lang);
    ensureDirExists(vaultTemplateDirpath);

    if (dirExists(vaultDirpath)) {
      throw new Error(`Vault directory must not exist: ${vaultDirpath}`);
    }
    const scriptSourceFilepath = Mustache.render(scriptSourceFilepathTemplate, { lang });

    // The vault template contains SCRIPT_STUB file, that we're going to replace with our script.
    // So we first need to find this file and then pass its path to mustache templates from the vault template

    const scriptStubRelativeDirpath = await getScriptStubRelativeDirpath(vaultTemplateDirpath, scriptStubFilename);

    if (scriptStubRelativeDirpath == null) {
      throw new Error(`Script stub file not found: ${scriptStubFilename}`);
    }
    const scriptRelativeFilepath = join(scriptStubRelativeDirpath, scriptFilename);

    // Now we can initialize data for our Mustache templates in the vault template
    const mustacheData = {
      scriptFilepath: removeFileExtension(scriptRelativeFilepath),
    };

    // Building the vault from the vault template
    for await (const { path, isDir } of getFiles(vaultTemplateDirpath)) {
      const relativePath = relative(vaultTemplateDirpath, path);
      const outputPath = join(vaultDirpath, relativePath);
      if (isDir) {
        dbg(`Entering directory: ${path}`);
        if (!dirExists(outputPath)) {
          dbg(`Creating directory ${outputPath}`);
          await createDir(outputPath);
        }
      } else {
        // Process files
        if (extname(relativePath) === MUSTACHE_EXT) {
          // Process mustache-files
          dbg(`Processing template ${path}`);
          const output = Mustache.render(await getFileContents(path), mustacheData);
          const outputPathRefined = removeFileExtension(outputPath);
          dbg(`Writing ${outputPathRefined}`);
          await saveFile(outputPathRefined, output);
        } else if (basename(relativePath) === scriptStubFilename) {
          // Process model stub
          const scriptFilepath = join(dirname(outputPath), scriptFilename);
          dbg(`Saving script ${scriptFilepath}`);
          await saveFile(scriptFilepath, await getFileContents(scriptSourceFilepath));
        } else {
          // Copy files
          dbg(`Copying ${path} > ${outputPath}`);
          await copyFile(path, outputPath);
        }
      }
    }
    log(`New LLB vault for lang "${lang}" created in "${resolve(vaultDirpath)}"`);
  } catch (e) {
    if (e instanceof Error) {
      err(e.message);
    }
    process.exit(1);
  }
}

// Finds scriptStubFilename in the vaultTempalteDir and
// returns path to its containing dir relative to the vaultTempalteDir
async function getScriptStubRelativeDirpath(vaultTemplateDirpath: string, scriptStubFilename: string) {
  for await (const { path } of getFiles(vaultTemplateDirpath)) {
    if (basename(path) === scriptStubFilename) {
      return dirname(relative(vaultTemplateDirpath, path));
    }
  }
}

function ensureDirExists(dirpath: string) {
  if (!dirExists(dirpath)) {
    throw new Error(`Directory not found: ${dirpath}`);
  }
}
