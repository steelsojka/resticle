import { Injectable, Inject } from '@angular/core';
import { 
  RequestMethod, 
  RequestOptionsArgs, 
  ResponseContentType, 
  Response, 
  Http, 
  Headers, 
  URLSearchParams 
} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';
import 'rxjs/add/operator/map';
import { 
  RequestMethod as ResticleRequestMethod,
  ResourceFetchClient, 
  ResourceRequest, 
  ResponseContentType as ResticleResponseContentType 
} from '@resticle/core';

import {
  HTTP_REQUEST_INTERCEPTORS,
  HTTP_RESPONSE_INTERCEPTORS,
  HttpRequestInterceptor,
  HttpResponseInterceptor
} from './common';

@Injectable()
export class HttpResourceClient implements ResourceFetchClient {
  constructor(
    @Inject(Http) private http: Http,
    @Inject(HTTP_REQUEST_INTERCEPTORS) private requestInterceptors: HttpRequestInterceptor<any>[] = [],
    @Inject(HTTP_RESPONSE_INTERCEPTORS) private responseInterceptors: HttpResponseInterceptor<any>[] = []
  ) {}

  get<T>(req: ResourceRequest<T>): Observable<T> {
    return this.request(req);
  }
  
  put<T>(req: ResourceRequest<T>): Observable<T> {
    return this.request(req);
  }

  delete<T>(req: ResourceRequest<T>): Observable<T> {
    return this.request(req);
  }

  post<T>(req: ResourceRequest<T>): Observable<T> {
    return this.request(req);
  }

  serializeQuery(): string {
    return ''; // Allow Angular to serialize the query.
  }

  private request<T>(req: ResourceRequest<T>): Observable<T> {
    return new Observable<T>((observer: Subscriber<T>) => {
      let promise = Promise.resolve(req); 

      for (const interceptor of this.requestInterceptors) {
        promise = promise.then(_req => interceptor.request(_req));
      }
      
      promise.then(newReq => {
        this.http.request(req.path, this.convertRequest(newReq))
          .map(res => {
            const data = this.extract<T>(res);

            let promise = Promise.resolve(data);

            for (const resInterceptor of this.responseInterceptors) {
              promise = promise.then(_res => resInterceptor.response(_res));
            }

            promise.then(_res => {
              observer.next(_res);
              observer.complete();
            });
          });
      });
    });
  }

  private convertRequest<T>(req: ResourceRequest<T>): RequestOptionsArgs {
    return {
      withCredentials: Boolean(req.withCredentials),
      method: this.convertMethod(req.method),
      body: req.body,
      headers: new Headers(req.headers || {}),
      search: this.convertParams(req.search),
      responseType: this.convertResponseType(req.responseType)
    };
  }

  private convertResponseType(type?: ResticleResponseContentType): ResponseContentType {
    switch (type) {
      case ResticleResponseContentType.BLOB: return ResponseContentType.Blob;
      case ResticleResponseContentType.ARRAY_BUFFER: return ResponseContentType.ArrayBuffer;
      case ResticleResponseContentType.TEXT: return ResponseContentType.Text;
      case ResticleResponseContentType.JSON:
      default: 
        return ResponseContentType.Json;
    }
  }

  private convertMethod(method: ResticleRequestMethod): RequestMethod {
    switch (method) {
      case ResticleRequestMethod.DELETE: return RequestMethod.Delete;
      case ResticleRequestMethod.PUT: return RequestMethod.Put;
      case ResticleRequestMethod.POST: return RequestMethod.Post;
      case ResticleRequestMethod.GET:
      default: 
        return RequestMethod.Get;
    }
  }

  private convertParams(search: {[key: string]: any}): URLSearchParams {
    return Object.keys(search).reduce((params, key) => {
      params.set(key, search[key]);

      return params;
    }, new URLSearchParams());
  }

  private extract<T>(res: Response): T {
    return res.json();  
  }
}