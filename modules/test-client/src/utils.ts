export class Deferred<T> {
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
  promise: Promise<T>;
  
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }  
}

export function isObject(obj: any): boolean {
  return obj && typeof obj === 'object';
}