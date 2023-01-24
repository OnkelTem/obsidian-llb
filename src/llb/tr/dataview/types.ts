export type TypeFunctionProps = {
  required?: boolean;
  multiple?: boolean;
};

export type FieldValue = {
  value?: string | string[];
  error?: string;
};

export type TypeFunction = (props: TypeFunctionProps) => (value: string) => FieldValue;

export type Fields = {
  [fieldName: string]: ReturnType<TypeFunction>;
};

export type FieldValues<TFields extends Fields> = {
  [K in keyof TFields]: FieldValue;
};

export type Values<TFields extends Fields> = {
  [K in keyof TFields]: string | string[] | undefined;
};

export type Item<TFields extends Fields, TValues extends Values<TFields>> = {
  label: string;
  render: (values: TValues, note: Note, model: Model<TFields, TValues>) => string | string[] | undefined;
};

export type Model<TFields extends Fields, TValues extends Values<TFields>> = {
  name: string;
  location: string;
  fields: TFields;
  items: Item<TFields, TValues>[];
};
