export type Schema = {
  templateFilepath: string;
  dataDirpath: string;
};

export type Schemas = {
  [k: string]: Schema;
};

export function createSchema<T extends Schema>(schema: T) {
  return schema;
}

export function createSchemas<T extends Schemas>(schemas: T) {
  return schemas;
}
