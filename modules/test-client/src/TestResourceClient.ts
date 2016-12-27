import {
  ResourceFetchClient,
  ResourceRequest,
  RequestMethod
} from 'resticle';

import { Deferred } from './utils';

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

  step(value: any): Promise<any> {
    const req = this.pendingRequests.shift();
    
    if (!req) {
      throw new Error('No pending requests to flush!');
    }

    req.deferred.resolve(value);

    return req.deferred.promise;
  }

  expect(method: RequestMethod, params: ExpectParams): void {
    for (const { request, value:val } of this.completedRequests) {
      if (request.method === method) {
        let matches = true;
        
        for (const key of Object.keys(params)) {
          switch (key) {
            case 'headers':
              matches = this.assertObject(request.headers, params.headers);
              break;
            case 'params':
              matches = this.assertObject(request.search, params.search);
              break;
            case 'path':
              matches = this.assertValue(request.path, params.path);
              break;
            case 'withCredentials':
              matches = this.assertValue(request.withCredentials, params.withCredentials);
              break;
            case 'body':
              matches = this.assertValue(request.body, params.body);
              break;
          }
        }

        if (matches) {
          return;
        }
      }
    }

    throw new Error(`Expected request method ${method} with ${params}`);
  }

  async flush(): Promise<any> {
    for (const req of this.pendingRequests) {
      req.deferred.resolve();
      await req.deferred.promise;
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
  }

  protected assertValue(actual: any, expected: any): boolean {
    return actual === expected;
  }

  protected assertObject(obj: {[key: string]: any}, expected: {[key: string]: any}): boolean {
    for (const key of Object.keys(expected)) {
      if (obj[key] !== expected[key]) {
        return false;
      }
    }

    return true;
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
      .then(value => this.onSuccess({ request: req, value, deferred }))
      .catch(reason => this.onError({ request: req, value: reason, deferred }))
      .then(value => this.completedRequests.push({ request: req, value, deferred }));
  }
}