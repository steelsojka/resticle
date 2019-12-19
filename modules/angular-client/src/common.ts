import { InjectionToken } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { ResourceFetchClient } from 'resticle';

/**
 * Token for registering interceptors.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_INTERCEPTORS = new InjectionToken<HttpInterceptor>(
  'HttpInterceptors'
);
/**
 * Token for registering interceptors.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_TRANSFORMS = new InjectionToken<HttpTransform>(
  'HttpTransforms'
);
/**
 * Token used for registering the http client to use for the resource factory.
 * @export
 * @type {OpaqueToken}
 */
export const HTTP_RESOURCE_CLIENT = new InjectionToken<ResourceFetchClient>(
  'HttpResourceClient'
);

/**
 * A request interceptor.
 * @export
 * @interface HttpRequestInterceptor
 * @template T
 */
export interface HttpRequestInterceptor {
  request(
    req: Partial<HttpRequest<any>>
  ): Partial<HttpRequest<any>> | Promise<Partial<HttpRequest<any>>>;
}

/**
 * A request error interceptor.
 * @export
 * @interface HttpRequestInterceptor
 * @template T
 */
export interface HttpRequestErrorInterceptor {
  requestError(
    err: any,
    req: Partial<HttpRequest<any>>
  ): Partial<HttpRequest<any>> | Promise<Partial<HttpRequest<any>>>;
}

/**
 * A response interceptor.
 * @export
 * @interface HttpResponseInterceptor
 * @template T The data type.
 */
export interface HttpResponseInterceptor {
  response(data: any, res: HttpResponse<any>): any | Promise<any>;
}

/**
 * A response interceptor.
 * @export
 * @interface HttpResponseInterceptor
 * @template T
 */
export interface HttpResponseErrorInterceptor {
  responseError(
    err: Response | any,
    req: Partial<HttpRequest<any>>
  ): any | Promise<any>;
}

/**
 * A response transformer.
 * @export
 * @interface HttpResponseTransform
 * @template T The entering data type.
 * @template U The transformed data type.
 */
export interface HttpResponseTransform<T, U> {
  response(data: T): U;
}

/**
 * A request transformer.
 * @export
 * @interface HttpRequestTransform
 */
export interface HttpRequestTransform {
  request(args: Partial<HttpRequest<any>>): Partial<HttpRequest<any>>;
}

export type HttpTransform =
  | HttpRequestTransform
  | HttpResponseTransform<any, any>;
export type HttpInterceptor =
  | HttpResponseErrorInterceptor
  | HttpResponseInterceptor
  | HttpRequestErrorInterceptor
  | HttpRequestInterceptor;
export type HttpRequestInterceptorType =
  | HttpRequestErrorInterceptor
  | HttpRequestInterceptor;
export type HttpResponseInterceptorType =
  | HttpResponseErrorInterceptor
  | HttpResponseInterceptor;

