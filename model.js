class Model {
  static name = "";
  static location = "";
  static fields = {};

  constructor(note) {
    if (this.constructor == Model) {
      throw new Error("Abstract classes can't be instantiated.");
    }
    this.note = note;
  }
  getTitle() {
    return this.note.file.name;
  }
  render() {
    throw new Error("Method 'render()' must be implemented.");
  }
  static isOfType(note) {
    return note.type === this.name;
  }
}

class Word extends Model {
  static name = "word";
  static location = "words";
  static fields = {
    suffixes: model__fieldArrayOfLinks(false, "suffix"),
    base: model__fieldArrayOfLinks(false, "word"),
    date: model__fieldString(true),
  };
  render() {
    renderFields(this.note, this);
    // TODO: Add back links
  }
}

class Suffix extends Model {
  static name = "suffix";
  static location = "suffixes";
  static fields = {
    subtype: model__fieldOptions(true, {
      n: "nominal suffix",
      v: "verbal suffix",
      p: "particle",
      o: "other",
    }),
    date: model__fieldString(true),
  };
  getTitle() {
    return "-" + this.note.file.name.replace("-", "/");
  }
  render() {
    renderFields(this.note, this);
    const legend = ["A = a, e", "I = i, ü, u, ı", "K = k, ğ", "D = t, d"];
    dv.paragraph(`\`Legend: ${legend.join("   ")}\``);
  }
}

const models = [Word, Suffix];

function main(dv, input) {
  if (input === "templates") {
    dv.el("pre", "Not implemented.");
    return;
  }
  // Read current note
  const note = dv.current();

  const modelClass = models.find((modelClass) => {
    return modelClass.isOfType(note);
  });

  // Detect note type
  try {
    if (modelClass == null) {
      throw new Error(`Cannot determine the model of the note.`);
    }
    const model = new modelClass(note);
    model.render();
  } catch (e) {
    if (e.message != null) {
      dv.paragraph(`**Error**: ${e.message}`);
    } else {
      dv.header(4, `Error:`);
      dv.paragraph(e.toString());
    }
  }
}

main(dv, input);

// Model helpers

function model__fieldString(required) {
  return (field) => {
    if (typeof field === "string") {
      return { value: field };
    } else if (!required && field == null) {
      return { value: "" };
    } else {
      return { error: "Must be a string" };
    }
  };
}

function model__fieldArrayOfStrings(required) {
  return (field) => {
    // Normal YAML array
    if (Array.isArray(field) && all(field, (i) => typeof i === "string")) {
      return { value: field };
    } else if (typeof field === "string") {
      // String comma-separated array
      if (field.indexOf(",") !== -1) {
        return { value: field.split(/\s*,\s*/).filter((item) => item !== "") };
      }
      // Just one value, so be it an array of one element
      else {
        return { value: [field] };
      }
    } else if (!required && field == null) {
      return { value: "" };
    } else {
      return { error: "Must be an array of strings" };
    }
  };
}

function model__fieldArrayOfLinks(required, noteTypeName) {
  return (field) => {
    const res = model__fieldArrayOfStrings(required)(field);
    if (res.error == null) {
      const [found, notFound] = findNotes(res.value, noteTypeName);
      res.value = [...found, ...notFound];
    }
    return res;
  };
}

function model__fieldLink(required, noteTypeName) {
  return (field) => {
    const res = model__fieldString(required)(field);
    if (res.error == null) {
      const [found, notFound] = findNotes([res.value], noteTypeName);
      res.value = [...found, ...notFound];
    }
    return res;
  };
}

function model__fieldOptions(required, options) {
  return (field) => {
    const keys = Object.keys(options);
    if (field != null) {
      if (keys.includes(field)) {
        return { value: options[field] };
      } else {
        return { error: `"${field}" is not in the allowed list: ${keys.join(" / ")}` };
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
  };
}

// Render helpers

function renderFields(note, model) {
  const fields = Object.entries(model.constructor.fields).map(([fieldName, parse]) => ({
    title: capitalize(fieldName),
    ...parse(note[fieldName], note),
  }));
  const items = fields
    // Render values
    .map(({ title, value, error }) => {
      return { title, output: error != null ? `⚠ ${error}` : Array.isArray(value) ? value.join(", ") : value };
    })
    // Hide empty fields
    .filter(({ output }) => output != null && output !== "")
    // Add titles
    .map(({ title, output }) => {
      return `\`${title}\` ${output}`;
    });
  items.unshift(`\`${capitalize(model.constructor.name)}\` ${model.getTitle()}`);
  dv.el("pre", items.join("<br/>"));
}

// Helpers

function findNotes(items, modelName) {
  const notFoundItems = [];
  const foundNotes = [];

  const model = models.find((modelClass) => modelClass.name === modelName);

  if (model == null) {
    new Error(`Model not found for "${modelName}"`);
  }

  const searchNotes = dv.pages(`"${model.location}"`);
  const variantsField = model.variantsField;

  for (let item of items) {
    const page = searchNotes.find(
      (p) => (variantsField != null && p[variantsField] != null && p[variantsField].includes(item)) || p.file.name === item
    );
    if (page != null) {
      foundNotes.push(page.file.link + `${page.file.name !== item ? " [" + item + "]" : ""}`);
    } else {
      notFoundItems.push(item);
    }
  }
  return [foundNotes, notFoundItems];
}

function all(array, f) {
  return array.reduce((acc, i) => {
    acc = acc && f(i);
    return acc;
  }, true);
}

function capitalize(word) {
  const lower = word.toLowerCase();
  return word.charAt(0).toUpperCase() + lower.slice(1);
}
