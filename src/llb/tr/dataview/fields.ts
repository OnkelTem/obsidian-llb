import { Fields, Model, TypeFunctionProps, Values } from "./types";
import { all } from "./utils";

export function fieldTypes() {
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
            } else {
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

export function resolveLink(value: string, folder: string) {
  const searchNotes = dv.pages(`"${folder}"`) as DataArray<Note>;
  const page = searchNotes.find((p) => p.file.name === value);
  if (page != null) {
    return page.file.link + `${page.file.name !== value ? " [" + value + "]" : ""}`;
  } else {
    return value;
  }
}

export function getFieldValues<TFields extends Fields, TValues extends Values<TFields>>(
  model: Model<TFields, TValues>,
  note: Note
) {
  const fieldErrors: { fieldName: keyof TFields; error: string }[] = [];
  const fieldValues = Object.entries(model.fields).reduce((accum, [fieldName, parser]) => {
    const { value, error } = parser(note?.[String(fieldName)]);
    if (error != null) {
      fieldErrors.push({ fieldName, error });
    } else if (value != null) {
      accum[fieldName] = value;
    }
    return accum;
  }, {} as Record<string, string | string[]>) as TValues;
  return { fieldValues, fieldErrors };
}
