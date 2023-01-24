export function all<T>(array: T[], f: (i: T) => boolean) {
  return array.reduce((acc, i) => {
    acc = acc && f(i);
    return acc;
  }, true);
}
