export function isFunction(value: any): value is Function {
  return typeof value === 'function';
}

export function isBoolean(value: any): value is boolean {
  return value === true || value === false;
}

export function isObject(value: any): boolean {
  return typeof value === 'object';
}

export function isString(value: any): value is string {
  return typeof value === 'string';
}

export function clone(value: any): any {
  return isObject(value)
    ? JSON.parse(JSON.stringify(value))
    : value;
}