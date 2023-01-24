import yargs from "yargs";
import {
  SCRIPT_FILENAME,
  SCRIPT_SOURCE_FILEPATH_TEMPLATE,
  SCRIPT_STUB_FILENAME,
  SUPPORTED_LANGS,
  VAULT_TEMPLATES_DIRPATH,
} from "./const";
import { createVault } from "./create-vault";
import { createLogger } from "./logger";
import { updateVault } from "./update-vault";
import { Abort } from "./utils";

export default function app(params: string[]) {
  return yargs(params)
    .demandCommand(1)
    .fail(function (msg: string | null, err: Error | null, yargs: any) {
      if (err != null) {
        console.error("\n\x1b[31m%s\x1b[0m", err.message);
        if (err.stack) {
          console.log(err.stack);
        }
      } else if (msg != null) console.error("\n\x1b[31m%s\x1b[0m", msg);
      process.exit(1);
    })
    .command(
      "create <lang> <path>",
      "Create LLB vault for the langauge.",
      (yargs) =>
        yargs
          .positional("lang", {
            description: "Board language",
            type: "string",
            choices: Array.from(SUPPORTED_LANGS.keys()),
            demandOption: true,
          })
          .positional("path", {
            description: "Vault path",
            type: "string",
            demandOption: true,
          })
          .options({
            debug: {
              alias: "d",
              description: "Output debugging information",
              type: "boolean",
              default: false,
            },
          }),
      async (argv) => {
        const logger = createLogger(argv.debug);
        try {
          await createVault({
            lang: argv.lang,
            vaultTemplatesDirpath: VAULT_TEMPLATES_DIRPATH,
            vaultDirpath: argv.path,
            scriptFilename: SCRIPT_FILENAME,
            scriptSourceFilepathTemplate: SCRIPT_SOURCE_FILEPATH_TEMPLATE,
            scriptStubFilename: SCRIPT_STUB_FILENAME,
            debug: argv.debug,
            logger,
          });
        } catch (e) {
          if (e instanceof Error) {
            logger.err(e.message);
          } else if (e instanceof Abort) {
            logger.log(e.message);
          } else {
            throw e;
          }
        }
      }
    )
    .command(
      "update <lang> <path>",
      "Update LLB vault for the language.",
      (yargs) =>
        yargs
          .positional("lang", {
            alias: "l",
            description: "Board language",
            type: "string",
            choices: Array.from(SUPPORTED_LANGS.keys()),
            demandOption: true,
          })
          .positional("path", {
            description: "Vault path",
            type: "string",
            demandOption: true,
          })
          .options({
            one: {
              description: "Apply one update and exit",
              type: "boolean",
              default: false,
            },
            ignoreObsidianRunning: {
              description: "Suppress user input if Obsidian detected",
              type: "boolean",
              default: false,
            },
            debug: {
              alias: "d",
              description: "Output debugging information",
              type: "boolean",
              default: false,
            },
            dryRun: {
              description: "Don't write changes, only show what's goona be done",
              type: "boolean",
              default: false,
            },
          }),
      async (argv) => {
        const logger = createLogger(argv.debug);
        try {
          await updateVault({
            lang: argv.lang,
            vaultDirpath: argv.path,
            debug: argv.debug,
            logger,
            dryRun: argv.dryRun,
            one: argv.one,
            ignoreObsidianRunning: argv.ignoreObsidianRunning,
          });
        } catch (e) {
          if (e instanceof Abort) {
            logger.log(e.message);
          } else if (e instanceof Error) {
            logger.err(e.message);
          } else {
            throw e;
          }
        }
      }
    )
    .example("$0 update tr", "Runs update on the Turkish board");
}
