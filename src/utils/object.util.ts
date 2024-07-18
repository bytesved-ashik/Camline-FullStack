/**
 * @description
 *
 * @param val
 */
export const isObject = (val: unknown): boolean => typeof val === 'object';

/**
 * @description converts key1:value1, key2:value2 to { key1: value1, key2: value2 }
 *
 * @param value
 */
export const colonToObject = (value: string): object => {
  return Object.fromEntries(value.split(',').map((field) => field.split(':')));
};

export function omit<T, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Omit<T, (typeof keys)[number]> {
  const result = { ...obj };
  keys.forEach(function (prop) {
    delete result[prop];
  });
  return result;
}

export function pick<T, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, (typeof keys)[number]> {
  const result = {} as Pick<T, (typeof keys)[number]>;
  keys.forEach(function (key) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  });
  return result;
}

export function getKeyByValue<T>(object: T, value: string) {
  return Object.keys(object).find((key) => object[key] === value);
}

export function replaceDescWithMinusOne(obj) {
  const result = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      result[key] = value.trim() === 'desc' ? -1 : 1;
    }
  }

  return result;
}
