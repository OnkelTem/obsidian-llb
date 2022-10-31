const wordModel = createModel({
  name: "word",
  location: "words",
  fields: {
    type: types().fixed({ value: "word" }),
    suffixes: types().string({ multiple: true }),
    base: types().string({ multiple: true }),
  },
  items: [
    {
      label: "Word",
      render: (_, note) => note.file.name,
    },
    {
      label: "Base",
      render: ({ base }) => (Array.isArray(base) ? base.map((value) => resolveLink(value, "words")) : undefined),
    },
    {
      label: "Suffixes",
      render: ({ suffixes }) =>
        Array.isArray(suffixes) ? suffixes.map((value) => resolveLink(value, suffixModel.location)) : undefined,
    },
    {
      label: "Base rev",
      render: (values) => {
        // const thisWord = note.file.name;
        return "Not implemented";
      },
    },
  ],
});

const suffixModel = createModel({
  name: "suffix",
  location: "suffixes",
  fields: {
    type: types().fixed({ value: "suffix" }),
    subtype: types().options({
      options: {
        n: "nominal suffix",
        v: "verbal suffix",
        p: "particle",
        o: "other",
      },
      required: true,
    }),
    date: types().string({ required: true }),
  },
  items: [
    {
      label: "Suffix",
      render: (_, note) => "-" + note.file.name.replace("-", "/"),
    },
    {
      label: "Subtype",
      render: (values) => (values.subtype ? values.subtype : undefined),
    },
  ],
});

function main() {
  if (input === "templates") {
    dv.el("pre", "Not implemented.");
    return;
  }

  try {
    const note = dv.current();
    if (note == null) {
      throw new Error(`Cannot read the current note.`);
    }

    const model = [wordModel, suffixModel].find((model) => model.name === note?.type);
    if (model == null) {
      throw new Error(`Cannot determine the model of the note.`);
    }

    model.render(note);
  } catch (e: any) {
    if (e.message != null) {
      dv.paragraph(`**Error**: ${e.message}`);
    } else {
      dv.header(4, `Error:`);
      dv.paragraph(e.toString());
    }
  }
}

// Helpers

function all<T>(array: T[], f: (i: T) => boolean) {
  return array.reduce((acc, i) => {
    acc = acc && f(i);
    return acc;
  }, true);
}

const BetterObject: {
  keys<T extends Record<string, unknown>>(object: T): (keyof T)[];
  values<T extends Record<string, unknown>>(Object: T): T[keyof T][];
  entries<T extends {}, K extends keyof T>(Object: T): [K, T[K]][];
} = {
  keys: (o) => Object.keys(o) as any,
  values: (o) => Object.values(o) as any,
  entries: (o) => Object.entries(o) as never,
};

function createModel<T extends Fields, K extends Values<T>>(model: Model<T, K>) {
  return {
    ...model,
    render: (note: Record<string, any>) => {
      // @ts-ignore
      const fieldValues = getFieldValues(model, note);
      // Check errors
      const errors = BetterObject.entries(fieldValues)
        .filter(([_, { error }]) => error != null)
        .map(([fieldName, { error }]) => `\`  ${String(fieldName)}:\` ⚠ ${error}`);

      if (errors.length > 0) {
        dv.el("pre", "`Errors:`<br/>" + errors.join("<br/>"));
      } else {
        const values = BetterObject.entries(fieldValues).reduce((accum, [fieldName, { value }]) => {
          // @ts-ignore
          accum[fieldName] = value;
          return accum;
        }, {} as K);
        const items = model.items
          .map((item) => ({ title: item.label, value: item.render(values, note) }))
          .map(({ title, value }) => `\`${title}:\` ${Array.isArray(value) ? value.join(", ") : value}`);
        dv.el("pre", items.join("<br/>"));
      }
    },
  };
}

function types() {
  return {
    string:
      ({ required = false, multiple = false }: TypeFunctionProps) =>
      (value: string) => {
        if (!multiple) {
          if (typeof value === "string") {
            return { value };
          } else if (!required && value == null) {
            return { value: "" };
          } else {
            return { error: "Must be a string" };
          }
        } else {
          // Normal YAML array
          if (Array.isArray(value) && all(value, (i) => typeof i === "string")) {
            return { value: value };
          } else if (typeof value === "string") {
            // String comma-separated array
            if (value.indexOf(",") !== -1) {
              return { value: value.split(/\s*,\s*/).filter((item) => item !== "") };
            }
            // Space separated array
            if (value.indexOf(" ") !== -1) {
              return { value: value.split(/ +/).filter((item) => item !== "") };
            }
            // Just one value, so be it an array of one element
            else {
              return { value: [value] };
            }
          } else if (!required && value == null) {
            return { value: "" };
          } else {
            return { error: "Must be an array of strings" };
          }
        }
      },
    options:
      ({ options = {}, required = false, multiple = false }: { options: Record<string, string> } & TypeFunctionProps) =>
      (value: string) => {
        const keys = Object.keys(options);
        if (!multiple) {
          if (value != null) {
            if (keys.includes(value)) {
              return { value: options[value] };
            } else {
              return {
                error: `"${value}" is not in the allowed list: ${keys.join(" / ")}`,
              };
            }
          } else if (required) {
            return {
              error: `Should be one of: ${keys.join(" / ")}`,
            };
          } else {
            return {
              value: "",
            };
          }
        } else {
          throw new Error("Multiple options is not implemented");
        }
      },
    fixed:
      ({ value: baseValue }: { value: string } & TypeFunctionProps) =>
      (value: string) =>
        value === baseValue ? { value } : { error: `Value must be "${baseValue}"` },
  } as const;
}

function resolveLink(value: string, folder: string) {
  const searchNotes = dv.pages(`"${folder}"`);
  const page = searchNotes.find((p) => p.file.name === value);
  if (page != null) {
    return page.file.link + `${page.file.name !== value ? " [" + value + "]" : ""}`;
  } else {
    return value;
  }
}

function getFieldValues<T extends Fields, K extends Values<T>>(model: Model<T, K>, note: Record<string, any>) {
  return BetterObject.entries(model.fields).reduce((accum, [fieldName, parser]) => {
    accum[fieldName] = parser(note?.[String(fieldName)]);
    return accum;
  }, {} as FieldValues<T>);
}

main();
