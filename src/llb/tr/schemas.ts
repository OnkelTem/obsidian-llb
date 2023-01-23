import { createSchema, createSchemas } from "../../schema";
import { LLB_PREFIX } from "../../const";
import { DATA_DIRNAME, LANG, TEMPLATES_DIRNAME } from "./const";

export default createSchemas({
  word: createSchema({
    templateFilepath: `_${LLB_PREFIX}-${LANG}_/${TEMPLATES_DIRNAME}/word.md`,
    dataDirpath: `_${LLB_PREFIX}-${LANG}_/${DATA_DIRNAME}/words`,
  }),
  suffix: createSchema({
    templateFilepath: `_${LLB_PREFIX}-${LANG}_/${TEMPLATES_DIRNAME}/suffix.md`,
    dataDirpath: `_${LLB_PREFIX}-${LANG}_/${DATA_DIRNAME}/suffixes`,
  }),
});
