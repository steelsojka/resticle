import { OpaqueToken } from '@angular/core';
import { RequestOptionsArgs, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';

/**
 * Token for registering request interceptors.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_REQUEST_INTERCEPTORS = new OpaqueToken('HttpRequestInterceptors');
/**
 * Token for registering response interceptors.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_RESPONSE_INTERCEPTORS = new OpaqueToken('HttpRequestInterceptors');
/**
 * Token used for registering the http client to use for the resource factory.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_RESOURCE_CLIENT = new OpaqueToken('HttpResourceClient');

/**
 * A request interceptor.
 * @export
 * @interface HttpRequestInterceptor
 * @template T
 */
export interface HttpRequestInterceptor<T> {
  request(req: RequestOptionsArgs): Observable<RequestOptionsArgs>|Promise<RequestOptionsArgs>;
  requestError(err: any, req: RequestOptionsArgs): Observable<RequestOptionsArgs>|Promise<RequestOptionsArgs>;
}

/**
 * A response interceptor.
 * @export
 * @interface HttpResponseInterceptor
 * @template T
 */
export interface HttpResponseInterceptor<T> {
  response(data: T, res: Response): Observable<any>|Promise<any>;
  responseError(err: any, res: Response): Observable<any>|Promise<any>;
}