import { OpaqueToken } from '@angular/core';
import { ResourceRequest } from 'resticle';

export const HTTP_REQUEST_INTERCEPTORS = new OpaqueToken('HttpRequestInterceptors');
export const HTTP_RESPONSE_INTERCEPTORS = new OpaqueToken('HttpRequestInterceptors');

export interface HttpRequestInterceptor<T> {
  request(req: ResourceRequest<T>): ResourceRequest<T>|Promise<ResourceRequest<T>>;
}

export interface HttpResponseInterceptor<T> {
  response(res: T): any;
}