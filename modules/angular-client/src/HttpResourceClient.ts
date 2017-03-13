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
  HTTP_INTERCEPTORS, 
  HTTP_TRANSFORMS,
  HttpInterceptor,
  HttpTransform,
  HttpResponseTransform,
  HttpRequestTransform,
  HttpResponseInterceptorType,
  HttpRequestInterceptorType
} from './common';
import { isFunction } from './utils';

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
    @Inject(HTTP_INTERCEPTORS) @Optional() private _interceptors: HttpInterceptor[]|null,
    @Inject(HTTP_TRANSFORMS) @Optional() private _transforms: HttpTransform[]|null,
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
    return this.ngZone.runGuarded(() => {
      const newReq = this.convertRequest(req);
      let $chain = Observable.of(newReq);

      $chain = this.executeInterceptor<RequestOptionsArgs>($chain, this._interceptors, [ 'request', 'requestError' ])
        .map(req => this._runTransformers<RequestOptionsArgs>(req, 'request'))
        .mergeMap(req => this.http.request(req.url, req));
      
      return this.executeInterceptor<Response>($chain, this._interceptors, [ 'response', 'responseError' ])
        .map(res => this.extract<T>(res))
        .map(res => this._runTransformers<T>(res, 'response'));
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
  protected executeInterceptor<T>($chain: Observable<T>, interceptors: HttpInterceptor[]|null, [ thenFn, errorFn ]: [ string, string ], ...args: any[]): Observable<T> {
    return interceptors.reduce((result, interceptor) => {
      if (isFunction(interceptor[thenFn])) {
        result = result.mergeMap(_res => Observable.fromPromise(Promise.resolve(interceptor[thenFn](_res, ...args))));
      }

      if (isFunction(interceptor[errorFn])) {
        result = result.catch(_res => Observable.fromPromise(Promise.resolve(interceptor[errorFn](_res, ...args))))
      }

      return result;
    }, $chain);
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

  private _runTransformers<T>(payload: any, method: string): T {
    const transforms = this._transforms || [];
    
    return transforms.reduce((result, transform) => {
      if (isFunction(transform[method])) {
        return transform[method](payload);
      }

      return payload;
    }, payload);
  }
}