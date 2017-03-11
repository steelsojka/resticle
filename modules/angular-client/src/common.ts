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
export interface HttpRequestInterceptor {
  request(req: RequestOptionsArgs): RequestOptionsArgs|Promise<RequestOptionsArgs>;
}

/**
 * A request error interceptor.
 * @export
 * @interface HttpRequestInterceptor
 * @template T 
 */
export interface HttpRequestErrorInterceptor {
  requestError(err: any, req: RequestOptionsArgs): RequestOptionsArgs|Promise<RequestOptionsArgs>;
}

/**
 * A response interceptor.
 * @export
 * @interface HttpResponseInterceptor
 * @template T The data type.
 */
export interface HttpResponseInterceptor {
  response(data: any, res: Response): any|Promise<any>;
}

/**
 * A response interceptor.
 * @export
 * @interface HttpResponseInterceptor
 * @template T
 */
export interface HttpResponseErrorInterceptor {
  responseError(err: Response|any, req: RequestOptionsArgs): any|Promise<any>;
}