import { join } from "path";
import { copyFile, deleteFile, dirExists, renameDir, updateFrontMatter, updateText, walkNotes } from "../../utils";
import { LLB_PREFIX } from "../../const";
import { createUpdater } from "../../types";

function withoutProps<T extends Record<string, unknown>>(obj: T, props: (keyof T)[]) {
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !props.includes(k)));
}

export default createUpdater(({ lang, vaultDirpath }, logger, dryRun) => {
  const { log, dbg, err } = logger;
  return {
    getLlbDirpath() {
      const oldDirpath = join(vaultDirpath, "_data_");
      const standardDirpath = join(vaultDirpath, `_${LLB_PREFIX}-${lang}_`);
      return dirExists(oldDirpath) ? oldDirpath : standardDirpath;
    },
    getUpdates() {
      const updater = this;
      return [
        [
          "1.1",
          "Rename directory _data_ to _llb-tr_.",
          async () => {
            const oldLlbDirpath = join(vaultDirpath, "_data_");
            const newLlbDirpath = join(vaultDirpath, "_llb-tr_");
            if (!dryRun) {
              await renameDir(oldLlbDirpath, newLlbDirpath);
            }
          },
        ],
        [
          "1.2",
          "Add synonyms and antonyms fields to the word model.",
          async () => {
            await walkNotes(
              updater.getLlbDirpath(),
              async (filepath) =>
                await updateFrontMatter(filepath, logger, dryRun, (fm) => {
                  if (fm.attributes.type === "word") {
                    if (!fm.attributes.hasOwnProperty("synonyms")) {
                      fm.attributes.synonyms = null;
                    }
                    if (!fm.attributes.hasOwnProperty("antonyms")) {
                      fm.attributes.antonyms = null;
                    }
                    return fm;
                  }
                })
            );
          },
        ],
        [
          "1.3",
          "Add word/suffix fields to the models.",
          async () => {
            await walkNotes(
              join(updater.getLlbDirpath(), "templates"),
              async (filepath) =>
                await updateFrontMatter(filepath, logger, dryRun, (fm) => {
                  if (fm.attributes.type === "word") {
                    return {
                      ...fm,
                      attributes: {
                        word: "<% tp.file.title %>",
                        ...withoutProps(fm.attributes, ["word"]),
                      },
                    };
                  }
                  if (fm.attributes.type === "suffix") {
                    return {
                      ...fm,
                      attributes: {
                        suffix: "<% tp.file.title %>",
                        ...withoutProps(fm.attributes, ["suffix"]),
                      },
                    };
                  }
                })
            );
            await walkNotes(
              join(updater.getLlbDirpath(), "vocab"),
              async (filepath) =>
                await updateFrontMatter(filepath, logger, dryRun, (fm, { name }) => {
                  if (fm.attributes.type === "word") {
                    return {
                      ...fm,
                      attributes: {
                        word: name,
                        ...withoutProps(fm.attributes, ["word"]),
                      },
                    };
                  }
                  if (fm.attributes.type === "suffix") {
                    return {
                      ...fm,
                      attributes: {
                        suffix: name,
                        ...withoutProps(fm.attributes, ["suffix"]),
                      },
                    };
                  }
                })
            );
          },
        ],
        [
          "1.4",
          "Remove fields date and type.",
          async () => {
            await walkNotes(
              updater.getLlbDirpath(),
              async (filepath) =>
                await updateFrontMatter(filepath, logger, dryRun, (fm) => {
                  if (fm.attributes.hasOwnProperty("date") || fm.attributes.hasOwnProperty("type")) {
                    delete fm.attributes.date;
                    delete fm.attributes.type;
                    return fm;
                  }
                })
            );
          },
        ],
        [
          "1.5",
          "Use new script location: remove the old model.js and update dv.view() calls.",
          async () => {
            if (!dryRun) {
              await deleteFile(join(vaultDirpath, "model.js"));
            }
            await walkNotes(updater.getLlbDirpath(), async (filepath) => {
              await updateFrontMatter(filepath, logger, dryRun, (fm) => {
                const newBody = updateText(fm.body, (line) => {
                  if (line === 'await dv.view("model")') {
                    return 'await dv.view("card")';
                  }
                });
                if (newBody !== fm.body) {
                  return {
                    ...fm,
                    body: newBody,
                  };
                }
              });
            });
          },
        ],
        [
          "1.6",
          "Remove 'Meaning' and 'Examples' headers from models",
          async () => {
            await walkNotes(updater.getLlbDirpath(), async (filepath) => {
              await updateFrontMatter(filepath, logger, dryRun, (fm) => {
                const newBody = updateText(fm.body, (line) => {
                  if (line.startsWith("## Meaning")) {
                    // Make empty line
                    return "";
                  }
                  if (line.startsWith("## Examples")) {
                    // Remove this line
                    return false;
                  }
                });
                if (newBody !== fm.body) {
                  return {
                    ...fm,
                    body: newBody,
                  };
                }
              });
            });
          },
        ],
        [
          "1.7",
          "Update card.js",
          async () => {
            if (!dryRun) {
              await copyFile("dataview/tr/card.js", join(updater.getLlbDirpath(), "card.js"));
            }
          },
        ],
      ];
    },
  };
});
