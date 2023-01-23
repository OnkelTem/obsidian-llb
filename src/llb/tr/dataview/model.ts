import { getFieldValues } from "./fields";
import { Fields, Model, Values } from "./types";

export function createModel<TFields extends Fields, TValues extends Values<TFields>>(model: Model<TFields, TValues>) {
  return {
    ...model,
    render: (note: Note) => {
      const { fieldValues, fieldErrors } = getFieldValues(model, note);
      if (fieldErrors.length == 0) {
        const items = model.items
          .map((item) => ({ title: item.label, value: item.render(fieldValues, note, model) }))
          .filter(({ value }) => value != null && (!Array.isArray(value) || value.length !== 0))
          .map(({ title, value }) => `\`${title}:\` ${Array.isArray(value) ? value.join(", ") : value}`);
        dv.el("pre", items.join("<br/>"));
      } else {
        const errors = fieldErrors.map(({ fieldName, error }) => `\`  ${String(fieldName)}:\` ⚠ ${error}`);
        dv.el("pre", "`Errors:`<br/>" + errors.join("<br/>"));
      }
    },
  };
}
