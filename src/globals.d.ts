declare const input: string;
declare const dv: import("obsidian-dataview/lib/api/inline-api").DataviewInlineApi;

type TypeFunctionProps = {
  required?: boolean;
  multiple?: boolean;
};

type FieldValue = {
  value?: string | string[];
  error?: string;
};

type TypeFunction = (props: TypeFunctionProps) => (value: string) => FieldValue;

type Fields = {
  [k: string]: ReturnType<TypeFunction>;
};

type FieldValues<T extends Fields> = {
  [K in keyof T]: FieldValue;
};

type Values<T extends Fields> = {
  [K in keyof T]: string | string[] | undefined;
};

type Item<T> = {
  label: string;
  render: (values: T, node: any) => string | string[] | undefined;
};

type Model<T extends Fields, K extends Values<T>> = {
  name: string;
  location: string;
  fields: T;
  items: Item<K>[];
};
