import { Injectable, Inject, Optional } from '@angular/core';
import {
  HttpRequest,
  HttpResponse,
  HttpClient,
  HttpHeaders,
  HttpParams
} from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
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
  HttpTransform
} from './common';
import { isFunction } from './utils';

/**
 * A Resticle client using Angulars HTTP service. Adds support for request and response
 * interceptors.
 */
@Injectable()
export class AngularHttpResourceClient implements ResourceFetchClient {
  private _interceptors!: HttpInterceptor[];
  private _transforms!: HttpTransform[];

  constructor(
    @Inject(HttpClient) private http: HttpClient,
    @Inject(HTTP_INTERCEPTORS)
    @Optional()
    _interceptors: HttpInterceptor[] | null,
    @Inject(HTTP_TRANSFORMS)
    @Optional()
    _transforms: HttpTransform[] | null
  ) {
    this._interceptors = _interceptors ?? [];
    this._transforms = _transforms ?? [];
  }

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

  subscribe<T>(
    reqResult: Observable<T>,
    callback: (val: any) => T
  ): Observable<T> {
    return reqResult.pipe(map(res => callback(res)));
  }

  /**
   * Performs an Angular HTTP request and invokes interceptors.
   */
  protected request<T>(req: ResourceRequest<T>): Observable<T> {
    return of(this.convertRequest(req)).pipe(
      source =>
        this.executeInterceptor<Partial<HttpRequest<T>>>(
          source,
          this._interceptors,
          ['request', 'requestError']
        ),
      map(req => this._runTransformers<HttpRequest<T>>(req, 'request')),
      mergeMap<HttpRequest<T>, Observable<HttpResponse<T>>>(req =>
        this.http.request(req.method, req.url, req)
      ),
      source =>
        this.executeInterceptor<HttpResponse<T>>(source, this._interceptors, [
          'response',
          'responseError'
        ]),
      map(res => this._runTransformers<T>(res, 'response'))
    );
  }

  /**
   * Executes an interceptor.
   */
  protected executeInterceptor<T>(
    $chain: Observable<T>,
    interceptors: HttpInterceptor[],
    [thenFn, errorFn]: [string, string],
    ...args: any[]
  ): Observable<T> {
    return interceptors.reduce((result, interceptor) => {
      if (isFunction(interceptor[thenFn])) {
        result = result.pipe(
          mergeMap(_res =>
            from(Promise.resolve(interceptor[thenFn](_res, ...args)))
          )
        );
      }

      if (isFunction(interceptor[errorFn])) {
        result = result.pipe(
          catchError(_res =>
            from(Promise.resolve(interceptor[errorFn](_res, ...args)))
          )
        );
      }

      return result;
    }, $chain);
  }

  /**
   * Maps a Resticle request to an Angular HTTP request.
   */
  protected convertRequest<T>(
    req: ResourceRequest<T>
  ): Partial<HttpRequest<T>> {
    return {
      url: req.url,
      withCredentials: Boolean(req.withCredentials),
      method: this.convertMethod(req.method),
      body: req.body,
      headers: new HttpHeaders(req.headers || {}),
      params: this.convertParams(req.search),
      responseType: this.convertResponseType(req.responseType)
    };
  }

  /**
   * Converts the response type to Angular response type.
   * @param type The content type
   */
  protected convertResponseType(
    type: ResticleResponseContentType
  ): 'arraybuffer' | 'blob' | 'json' | 'text' {
    switch (type) {
      case ResticleResponseContentType.BLOB:
        return 'blob';
      case ResticleResponseContentType.ARRAY_BUFFER:
        return 'arraybuffer';
      case ResticleResponseContentType.TEXT:
        return 'text';
      default:
        return 'json';
    }
  }

  /**
   * Maps the request method to an Angular HTTP request method.
   */
  protected convertMethod(
    method: ResticleRequestMethod
  ): 'delete' | 'put' | 'get' | 'post' {
    switch (method) {
      case ResticleRequestMethod.DELETE:
        return 'delete';
      case ResticleRequestMethod.PUT:
        return 'put';
      case ResticleRequestMethod.POST:
        return 'post';
      default:
        return 'get';
    }
  }

  /**
   * Maps a search object to an Angular Param object.
   */
  protected convertParams(search: { [key: string]: any } = {}): HttpParams {
    return Object.keys(search).reduce(
      (params, key) => params.set(key, search[key]),
      new HttpParams()
    );
  }

  private _runTransformers<T>(payload: any, method: string): T {
    const transforms = this._transforms || [];

    return transforms.reduce((result, transform) => {
      if (isFunction(transform[method])) {
        return transform[method](result);
      }

      return result;
    }, payload);
  }
}
