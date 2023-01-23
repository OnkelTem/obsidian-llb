import { fieldTypes, resolveLink, getFieldValues } from "../fields";
import { createModel } from "../model";
import { Model } from "../types";

export function createWordModel(dataDirpath: string, suffixModel: Model<any, any>) {
  return createModel({
    name: "word",
    location: dataDirpath,
    fields: {
      word: fieldTypes().string({ multiple: false }),
      suffixes: fieldTypes().string({ multiple: true }),
      base: fieldTypes().string({ multiple: true }),
      synonyms: fieldTypes().string({ multiple: true }),
      antonyms: fieldTypes().string({ multiple: true }),
    },
    items: [
      {
        label: "Word",
        render: ({ word }) => word,
      },
      {
        label: "Base",
        render: ({ base }, _, m) => (Array.isArray(base) ? base.map((value) => resolveLink(value, m.location)) : undefined),
      },
      {
        label: "Suffixes",
        render: ({ suffixes }) =>
          Array.isArray(suffixes) ? suffixes.map((value) => resolveLink(value, suffixModel.location)) : undefined,
      },
      {
        label: "Synonyms",
        render: ({ word, synonyms }, thisNote, model) => {
          const res = Array.isArray(synonyms) ? synonyms.map((value) => resolveLink(value, model.location)) : [];
          const folder = model.location;
          const wordPages = dv.pages(`"${folder}"`) as DataArray<Note>;

          const backRefs = wordPages
            .array()
            .filter(({ file: { path } }) => path != thisNote.file.path)
            .map((note) => {
              const {
                fieldValues: { synonyms },
              } = getFieldValues(model, note);
              const synonymsRefined =
                synonyms != null && synonyms !== "" ? (typeof synonyms === "string" ? [synonyms] : synonyms) : [];

              if (!Array.isArray(word)) {
                const key = word != null && word !== "" ? word : note.file.name;
                if (synonymsRefined.includes(key)) {
                  return { key, note };
                }
              }
            })
            .map((noteInfo) => {
              if (noteInfo != null) {
                return noteInfo.note.file.link + ` [${noteInfo.key} (r)]`;
              }
            })
            .filter((value) => value != null) as string[];

          return res.concat(backRefs);
        },
      },
      {
        label: "Antonyms",
        render: ({ antonyms }, _, m) =>
          Array.isArray(antonyms) ? antonyms.map((value) => resolveLink(value, m.location)) : undefined,
      },
    ],
  });
}
