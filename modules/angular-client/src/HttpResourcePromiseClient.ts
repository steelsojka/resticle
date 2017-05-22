import { Injectable, Inject } from '@angular/core';
import { 
  Http
} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { ResourceRequest, ResourceFetchClient } from 'resticle';
import { HttpResourceClient } from './HttpResourceClient';

/**
 * A resource client using Promises instead of Observables.
 * @export
 * @class HttpResourcePromiseClient
 */
@Injectable()
export class HttpResourcePromiseClient implements ResourceFetchClient {
  constructor(
    @Inject(HttpResourceClient) private httpResourceClient: HttpResourceClient
  ) {}
  
  get<T>(req: ResourceRequest<T>): Promise<T> {
    return this.httpResourceClient.get(req).toPromise();
  }
  
  put<T>(req: ResourceRequest<T>): Promise<T> {
    return this.httpResourceClient.put(req).toPromise();
  }

  delete<T>(req: ResourceRequest<T>): Promise<T> {
    return this.httpResourceClient.delete(req).toPromise();
  }

  post<T>(req: ResourceRequest<T>): Promise<T> {
    return this.httpResourceClient.post(req).toPromise();
  }

  serializeQuery(): string {
    return '';
  }

  subscribe<T>(res: Promise<T>, callback: (val: any) => T): Promise<T> {
    return res.then(val => callback(val));
  }
}