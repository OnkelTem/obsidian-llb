import { createWordModel } from "./models/word.model";
import { createSuffixModel } from "./models/suffix.model";
import schemas from "../schemas";

const suffixModel = createSuffixModel(schemas.suffix.dataDirpath);
const wordModel = createWordModel(schemas.word.dataDirpath, suffixModel);
try {
  const note = dv.current() as Note | undefined;
  if (note == null) {
    throw new Error(`Cannot read the current note.`);
  }

  const model = [wordModel, suffixModel].find((model) => note.hasOwnProperty(model.name));
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
