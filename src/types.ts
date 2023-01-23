import { Lang } from "./const";
import { Logger } from "./logger";

export type UpdateId = number;
export type UpdateIdStr = string;
export type UpdateDescription = string;
export type UpdateFunc = () => Promise<void>;
export type Update = [UpdateIdStr, UpdateDescription, UpdateFunc];

export type VersionNum = number;
export type UpdateNum = number;

export type UpdatePrepared = {
  updateId: UpdateId;
  update: Update;
};

export type Version = {
  versionNum: VersionNum;
  updateNum: UpdateNum;
};

export type VaultInfo = {
  lang: Lang;
  vaultDirpath: string;
};

export type UpdaterInfo = {
  getLlbDirpath: () => string;
  getUpdates: () => Update[];
};

export type Updater<T extends UpdaterInfo> = (vaultInfo: VaultInfo, logger: Logger, dryRun: boolean) => T;

export function createUpdater<T extends UpdaterInfo>(updater: Updater<T>) {
  return updater;
}

export type Updaters = Map<Lang, Updater<any>>;

export function createUpdaters<T extends UpdaterInfo>(updaters: { [k in Lang]: Updater<T> }) {
  return updaters;
}
