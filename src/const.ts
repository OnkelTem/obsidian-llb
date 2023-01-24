export const langs = ["tr"] as const;
export type Lang = typeof langs[number];
export const SUPPORTED_LANGS = new Map<Lang, string>([["tr", "Türkce"]]);

export const LLB_PREFIX = "llb";
export const VERSION_FILENAME = "version";

export const SCRIPT_FILENAME = "card.js";
export const SCRIPT_SOURCE_FILEPATH_TEMPLATE = `dataview/{{lang}}/card.js`;
export const SCRIPT_STUB_FILENAME = "model_stub";
export const VAULT_TEMPLATES_DIRPATH = `vault-templates`;
