import {
  ResourceFetchClient,
  ResourceRequest,
  RequestMethod
} from 'resticle';

import { Deferred, isObject } from './utils';

export interface MockRequest<T> {
  deferred: Deferred<T>;
  request: ResourceRequest<T>;
  value: any;
}

export interface ExpectParams {
  path?: string;
  headers?: {[key: string]: any};
  search?: {[key: string]: any};
  withCredentials?: boolean;
  body?: any;
  url?: string;
}

export class TestResourceClient implements ResourceFetchClient {
  expectGET: (params?: ExpectParams) => void = this.expect.bind(this, RequestMethod.GET);
  expectPOST: (params?: ExpectParams) => void = this.expect.bind(this, RequestMethod.POST);
  expectPUT: (params?: ExpectParams) => void = this.expect.bind(this, RequestMethod.PUT);
  expectDELETE: (params?: ExpectParams) => void = this.expect.bind(this, RequestMethod.DELETE);
  
  get successful(): MockRequest<any>[] {
    return this.resolvedRequests.slice(0);
  }

  get rejected(): MockRequest<any>[] {
    return this.rejectedRequests.slice(0);
  }
  
  protected pendingRequests: MockRequest<any>[] = [];
  protected resolvedRequests: MockRequest<any>[] = [];
  protected rejectedRequests: MockRequest<any>[] = [];
  protected completedRequests: MockRequest<any>[] = [];
  
  get(req: ResourceRequest<any>): Promise<any> {
    return this.request(req);
  }  

  post(req: ResourceRequest<any>): Promise<any> {
    return this.request(req);
  }

  put(req: ResourceRequest<any>): Promise<any> {
    return this.request(req);
  }

  delete(req: ResourceRequest<any>): Promise<any> {
    return this.request(req);
  }

  subscribe(res: Promise<any>, callback: (value: any) => any): Promise<any> {
    return res.then(val => callback(val));
  }

  step(value?: any): Promise<any> {
    const req = this.pendingRequests.shift();
    
    if (!req) {
      throw new Error('No pending requests to flush!');
    }

    req.deferred.resolve(value);

    return req.deferred.promise;
  }

  expect(method: RequestMethod, params: ExpectParams = {}): void {
    const matchingRequests = [];
    let allErrors = [];
    
    for (const { request, value:val } of this.completedRequests) {
      if (request.method === method) {
        const errors = [];
        
        for (const key of Object.keys(params)) {
          switch (key) {
            case 'headers':
              this.assertObject(request.headers, params.headers, errors);
              break;
            case 'search':
              this.assertObject(request.search, params.search, errors);
              break;
            case 'path':
              this.assertValue(request.path, params.path, errors);
              break;
            case 'url':
              this.assertValue(request.url, params.url, errors);
              break;
            case 'withCredentials':
              this.assertValue(request.withCredentials, params.withCredentials, errors);
              break;
            case 'body':
              this.assertObject(request.body, params.body, errors);
              break;
          }
        }

        if (!errors.length) {
          matchingRequests.push(request);
        } else {
          allErrors = [...allErrors, ...errors];
        }
      }
    }

    if (!matchingRequests.length) {
      if (allErrors.length) {
        throw new Error(allErrors[0]);
      } else {
        throw new Error(`Expected '${this.methodToString(method)}' but none was made.`);
      }
    }
  }

  async flush(): Promise<any> {
    for (const req of [...this.pendingRequests]) {
      await this.step();
    }
  }

  verifyNoOutstandingRequests() {
    if (this.pendingRequests.length > 0) {
      throw new Error(`Expected no outstanding requests. Still have ${this.pendingRequests.length} requests pending.`);
    }
  }

  reset() {
    this.flush();
    this.pendingRequests = [];
    this.resolvedRequests = [];
    this.rejectedRequests = [];
    this.completedRequests = [];
  }
  
  methodToString(method: RequestMethod): string {
    switch (method) {
      case RequestMethod.GET: return 'GET';
      case RequestMethod.POST: return 'POST';
      case RequestMethod.DELETE: return 'DELETE';
      case RequestMethod.PUT: return 'PUT';
      case RequestMethod.HEAD: return 'HEAD';
      case RequestMethod.PATCH: return 'PATCH';
      default:
        return '';
    }
  }

  protected assertValue(actual: any, expected: any, errors: string[]): void {
    if (actual !== expected) {
      errors.push(`Expected value '${actual}' to equal '${expected}'`);
    }
  }

  protected assertObject(obj: {[key: string]: any}, expected: {[key: string]: any}, errors: string[]): void {
    if (!isObject(expected) || !isObject(obj)) {
      errors.push(`Expected an object as expected value.`);

      return;
    }

    if (expected === obj) {
      return;
    }
    
    for (const key of Object.keys(expected)) {
      if (isObject(obj[key]) && isObject(expected[key])) {
        this.assertObject(obj[key], expected[key], errors);
        continue;
      }
      
      if (obj[key] !== expected[key]) {
        errors.push(`Expect object ${JSON.stringify(obj, null, '  ')} to equal ${JSON.stringify(expected, null, '  ')}`);
        
        return;
      }
    }
  }

  protected onSuccess(req: MockRequest<any>): void {
    this.resolvedRequests.push(req);
  }

  protected onError(req: MockRequest<any>) {
    this.rejectedRequests.push(req);
  }

  protected request(req: ResourceRequest<any>): Promise<any> {
    const deferred = new Deferred<any>();
    
    this.pendingRequests.push({
      deferred,
      request: req,
      value: undefined
    });

    return deferred.promise
      .then(value => {
        this.completedRequests.push({ request: req, value, deferred })
        this.onSuccess({ request: req, value, deferred });

        return value;
      })
      .catch(reason => {
        this.completedRequests.push({ request: req, value: undefined, deferred })
        this.onError({ request: req, value: reason, deferred })
      });
  }
}