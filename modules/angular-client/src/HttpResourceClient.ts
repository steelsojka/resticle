import { Injectable, Inject, Optional, NgZone } from '@angular/core';
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
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import { 
  RequestMethod as ResticleRequestMethod,
  ResourceFetchClient, 
  ResourceRequest, 
  ResponseContentType as ResticleResponseContentType 
} from 'resticle';

import {
  HTTP_REQUEST_INTERCEPTORS,
  HTTP_RESPONSE_INTERCEPTORS,
  HttpRequestInterceptor,
  HttpResponseInterceptor,
  HttpRequestErrorInterceptor,
  HttpResponseErrorInterceptor
} from './common';

export type HttpRequestInterceptors = Array<HttpRequestInterceptor|HttpRequestErrorInterceptor>;
export type HttpResponseInterceptors = Array<HttpResponseInterceptor|HttpResponseErrorInterceptor>;
export type HttpInterceptors = HttpRequestInterceptors|HttpResponseInterceptors;

/**
 * A Resticle client using Angulars HTTP service. Adds support for request and response
 * interceptors.
 * @export
 * @class HttpResourceClient
 * @implements {ResourceFetchClient}
 */
@Injectable()
export class HttpResourceClient implements ResourceFetchClient {
  constructor(
    @Inject(Http) private http: Http,
    @Inject(NgZone) private ngZone: NgZone,
    @Inject(HTTP_REQUEST_INTERCEPTORS) @Optional() private requestInterceptors: HttpRequestInterceptors|null,
    @Inject(HTTP_RESPONSE_INTERCEPTORS) @Optional() private responseInterceptors: HttpResponseInterceptors|null
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

  subscribe<T>(reqResult: Observable<T>, callback: (val: any) => T): Observable<T> {
    return reqResult.map(res => callback(res));
  }

  /**
   * Performs an Angular HTTP request and invokes interceptors.
   * @protected
   * @template T The return type.
   * @param {ResourceRequest<T>} req
   * @returns {Observable<T>}
   */
  protected request<T>(req: ResourceRequest<T>): Observable<T> {
    return this.ngZone.run(() => {
      const newReq = this.convertRequest(req);

      return this.executeInterceptor(this.requestInterceptors, newReq, 'request')
        .catch(err => this.executeInterceptor(this.requestInterceptors, err, 'requestError', newReq))
        .mergeMap(_req => this.http.request(_req.url, _req))
        .mergeMap(res => {
          return this.executeInterceptor(this.responseInterceptors, this.extract(res), 'response', res)
            .catch(err => this.executeInterceptor(this.responseInterceptors, err, 'responseError', res));
        });
    });
  }

  /**
   * Executes an interceptor.
   * @protected
   * @param {HttpInterceptors|null} interceptors 
   * @param {*} value 
   * @param {string} name 
   * @param {...any[]} args 
   * @returns {Observable<any>} 
   */
  protected executeInterceptor(interceptors: HttpInterceptors|null, value: any, name: string, ...args: any[]): Observable<any> {
    let $value = Observable.of(value);

    for (const interceptor of interceptors || []) {
      if (typeof interceptor[name] === 'function') {
        $value = $value.mergeMap(_res => Observable.fromPromise(Promise.resolve(interceptor[name](_res, ...args))));
      }
    }

    return $value;
  }

  /**
   * Maps a Resticle request to an Angular HTTP request.
   * @protected
   * @template T
   * @param {ResourceRequest<T>} req
   * @returns {RequestOptionsArgs}
   */
  protected convertRequest<T>(req: ResourceRequest<T>): RequestOptionsArgs {
    return {
      url: req.url,
      withCredentials: Boolean(req.withCredentials),
      method: this.convertMethod(req.method),
      body: req.body,
      headers: new Headers(req.headers || {}),
      search: this.convertParams(req.search),
      responseType: this.convertResponseType(req.responseType)
    };
  }

  /**
   * Maps the response type to an Angular HTTP response type.
   * @protected
   * @param {ResticleResponseContentType} [type]
   * @returns {ResponseContentType}
   */
  protected convertResponseType(type?: ResticleResponseContentType): ResponseContentType {
    switch (type) {
      case ResticleResponseContentType.BLOB: return ResponseContentType.Blob;
      case ResticleResponseContentType.ARRAY_BUFFER: return ResponseContentType.ArrayBuffer;
      case ResticleResponseContentType.TEXT: return ResponseContentType.Text;
      case ResticleResponseContentType.JSON:
      default: 
        return ResponseContentType.Json;
    }
  }

  /**
   * Maps the request method to an Angular HTTP request method.
   * @protected
   * @param {ResticleRequestMethod} method
   * @returns {RequestMethod}
   */
  protected convertMethod(method: ResticleRequestMethod): RequestMethod {
    switch (method) {
      case ResticleRequestMethod.DELETE: return RequestMethod.Delete;
      case ResticleRequestMethod.PUT: return RequestMethod.Put;
      case ResticleRequestMethod.POST: return RequestMethod.Post;
      case ResticleRequestMethod.GET:
      default: 
        return RequestMethod.Get;
    }
  }

  /**
   * Maps a search object to an Angular Param object.
   * @protected
   * @param {{[key: string]: any}} search
   * @returns {URLSearchParams}
   */
  protected convertParams(search: {[key: string]: any} = {}): URLSearchParams {
    return Object.keys(search).reduce((params, key) => {
      params.set(key, search[key]);

      return params;
    }, new URLSearchParams());
  }

  /**
   * Extracts data from the response object.
   * @protected
   * @template T Response type.
   * @param {Response} res
   * @returns {T}
   */
  protected extract<T>(res: Response): T {
    return res.json();  
  }
}