import { fieldTypes } from "../fields";
import { createModel } from "../model";

export function createSuffixModel(dataDirpath: string) {
  return createModel({
    name: "suffix",
    location: dataDirpath,
    fields: {
      suffix: fieldTypes().string({ multiple: false }),
      subtype: fieldTypes().options({
        options: {
          n: "nominal suffix",
          v: "verbal suffix",
          p: "particle",
          o: "other",
        },
        required: true,
      }),
    },
    items: [
      {
        label: "Suffix",
        render: ({ suffix }) => suffix,
      },
      {
        label: "Subtype",
        render: (values) => (values.subtype ? values.subtype : undefined),
      },
    ],
  });
}
