import { join } from "path";
import { Lang, LLB_PREFIX, VAULT_TEMPLATES_DIRPATH, VERSION_FILENAME as VAULT_VERSION_FILENAME, VERSION_FILENAME } from "./const";
import { Logger } from "./logger";
import updaters from "./llb/updaters";
import { Update, UpdateId, UpdateNum, UpdatePrepared, VaultInfo, Version, VersionNum } from "./types";
import { ensureObisidanIsNotRunning, getFileContents, isProcessRunning, saveFile } from "./utils";

type UpdateVaultProps = VaultInfo & {
  debug: boolean;
  logger: Logger;
  dryRun: boolean;
  one: boolean;
  ignoreObsidianRunning: boolean;
};

export async function updateVault({ lang, vaultDirpath, logger, dryRun, one, ignoreObsidianRunning }: UpdateVaultProps) {
  const { log } = logger;

  // Check if Obsidian is running
  await ensureObisidanIsNotRunning(ignoreObsidianRunning, logger);

  // Initialize the updater
  const updater = updaters[lang];
  // const { getLlbDirpath, getUpdates } = updater({ lang, vaultDirpath }, logger);
  const updaterInfo = updater({ lang, vaultDirpath }, logger, dryRun);

  // Detect vault version
  const vaultVersion = await getVersionFromFile(join(updaterInfo.getLlbDirpath(), VERSION_FILENAME));
  log(`Vault version: ${formatVersion(vaultVersion)}`);

  // Detect code version
  const codeVersion = await getVersionFromFile(join(VAULT_TEMPLATES_DIRPATH, lang, `_${LLB_PREFIX}-${lang}_`, VERSION_FILENAME));
  log(`Code version: ${formatVersion(codeVersion)}`);

  // Sort of filter updates
  const updates = prepareUpdates(codeVersion, vaultVersion, updaterInfo.getUpdates());

  let updatesCount = updates.length;

  if (updatesCount === 0) {
    log("No updates found");
    return;
  }

  log(`Found ${updatesCount} updates:`);
  updates.forEach(({ update: [v, d] }) => {
    log(`\t${v}: ${d}`);
  });

  log(`Running updates${dryRun ? " (in read-only mode)" : ""}...`);

  for (const {
    updateId,
    update: [v, d, f],
  } of updates) {
    log(`Applying update ${v}: ${d}...`);
    await f();
    // Note: calling getLlbDirpath() is required here as it returns the _current_ LLB dirpath,
    // which could has been changed by the previous updates!
    log(`Successfuly applied!`);
    log(`New vault vesion: ${formatVersion(updateIdToVersion(updateId))}`);
    if (!dryRun) {
      await updateVaultVersion(join(updaterInfo.getLlbDirpath(), VERSION_FILENAME), updateId);
    }
    updatesCount--;
    if (one) {
      log("Exiting after the first update due to the `--one` option...");
      break;
    }
  }

  if (updatesCount === 0) {
    // All updates have been applied => updating to the latest code version
    log("All updates were successfuly applied.");
    log(`New vault vesion: ${formatVersion(codeVersion)}`);
    if (!dryRun) {
      await updateVaultVersion(join(updaterInfo.getLlbDirpath(), VERSION_FILENAME), versionToUpdateId(codeVersion));
    }
  }
}

async function updateVaultVersion(versionFilepath: string, updateId: UpdateId) {
  const version = updateIdToVersion(updateId);
  try {
    await saveFile(versionFilepath, formatVersion(version));
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Cannot update vault version file "${versionFilepath}": ${e.message}`);
    }
    throw e;
  }
}

async function getVersionFromFile(versionFilepath: string): Promise<Version> {
  try {
    const versionContents = (await getFileContents(versionFilepath)).toString();
    const match = versionContents.match(/(^\d+)\.?(\d+)?/);
    if (match === null) {
      throw new Error(`"${versionContents}" is not a valid version. Must be in the format: "NN.MM", e.g. "2.3"`);
    }
    return {
      versionNum: ensureVersionNum(parseInt(match[1])),
      updateNum: match[2] != null ? ensureUpdateNum(parseInt(match[2])) : 0,
    };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`Cannot determine the vault version. ${e.message}`);
    }
    throw e;
  }
}

function prepareUpdates(codeVersion: Version, vaultVersion: Version, updates: Update[]): UpdatePrepared[] {
  // Sort updates and addes updateId field
  return (
    updates
      .map((update) => {
        // Parse update version field
        const versionInfo = update[0].match(/^(\d+).(\d+)$/);
        if (versionInfo == null) {
          throw new Error(`Wrong update format. Version field malformed: "${update[0]}"`);
        }
        const [version, updateNum] = [parseInt(versionInfo[1]), parseInt(versionInfo[2])];

        return {
          updateId: (version << 8) + updateNum,
          update,
        };
      })
      .sort(({ updateId: a }, { updateId: b }) => {
        return a > b ? 1 : a === b ? 0 : -1;
      })
      // Leave only futureVersion related updates
      .filter(({ updateId }) => updateId < versionToUpdateId(codeVersion))
      // Filter out applied updates
      .filter(({ updateId }) => updateId > versionToUpdateId(vaultVersion))
  );
}

// Helpers

function getVaultVersionFilepath(lang: Lang, vaultDirpath: string) {
  return join(vaultDirpath, `_${LLB_PREFIX}-${lang}_`, VAULT_VERSION_FILENAME);
}

function versionToUpdateId({ versionNum, updateNum }: Version) {
  return (versionNum << 8) + updateNum;
}

function updateIdToVersion(updateId: number): Version {
  return {
    versionNum: updateId >> 8,
    updateNum: updateId & 255,
  };
}

function formatVersion({ versionNum, updateNum }: Version) {
  return `${versionNum}${updateNum !== 0 ? "." + updateNum : ""}`;
}

function ensureVersionNum(versionNum: unknown): VersionNum {
  if (typeof versionNum === "number" && Number.isInteger(versionNum) && versionNum > 0) {
    return versionNum;
  } else {
    throw new Error(`Version number must be a positive integer greater than 0: "${versionNum}"`);
  }
}

function ensureUpdateNum(updateNum: unknown): UpdateNum {
  if (typeof updateNum === "number" && Number.isInteger(updateNum) && updateNum >= 1 && updateNum <= 255) {
    return updateNum;
  } else {
    throw new Error(`Update number must be a positive integer lesser than 255: "${updateNum}"`);
  }
}
