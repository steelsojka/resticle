export const RESOURCE_METADATA_KEY = 'resource:config';
export const RESOURCE_ACTIONS_METADATA_KEY = 'resource:action-config';

export enum RequestMethod {
  POST,
  PUT,
  DELETE,
  GET  
}

export enum ResponseContentType {
  TEXT,
  JSON,
  ARRAY_BUFFER,
  BLOB  
}

export interface ParsedURL {
  protocol: string;
  slashes: boolean;
  auth: {
    username: string;
    password: string;
  }|null;
  host: string;
  hostname: string;
  port: number|null;
  pathname: string;
  query: string;
  hash: string;
  href: string;
  origin: string;
}

export interface ResourceActionConfig {
  method: RequestMethod;
  path?: string;  
  params?: {[key: string]: any};
}

export interface TargetedResourceActionConfig {
  path?: string;  
  params?: {[key: string]: any};
}

export interface ResourceConfig {
  path: string;
  defaults?: boolean;
  params?: {[key: string]: any};
}

export interface ResourceActionMetadata {
  key: string;
  config: ResourceActionConfig;
}

export interface Type<T> {
  new (...args: any[]): T;
}

export interface ResourceRequest<T> {
  method: RequestMethod;
  url: ParsedURL;
  path: string;
  headers: {[key: string]: any};
  search: {[key: string]: any};
  withCredentials: boolean;
  responseType: ResponseContentType;
  body: T;
}

export interface ResourceRequestOptions {
  headers?: {[key: string]: any};
  withCredentials?: boolean;
  responseType?: ResponseContentType;
}

export interface ResourceParams {
  [key: string]: any;
}

export interface ResourceFetchClient {
  serializeQuery?: (query: {[key: string]: any}) => string;
  encodeParam?: (value: string) => string;
  
  get(req: ResourceRequest<any>): any;
  post(req: ResourceRequest<any>): any;
  delete(req: ResourceRequest<any>): any;
  put(req: ResourceRequest<any>): any;
}

export interface ResourceParamMethod<R> {
  (params?: ResourceParams, options?: ResourceRequestOptions): R;
}

export interface ResourceMethod<T, R> {
  (resource: T, params?: ResourceParams, options?: ResourceRequestOptions): R;
}

export abstract class DefaultResource<T, R, S> {
  get: ResourceParamMethod<R>;
  list: ResourceParamMethod<S>;
  create: ResourceMethod<T, R>;
  update: ResourceMethod<T, R>;
  delete: ResourceParamMethod<T>;
}

export interface TargetedResourceActionDecorator {
  (config?: TargetedResourceActionConfig): PropertyDecorator;
}

export interface RootResourceActionDecorator {
  (config: ResourceActionConfig): PropertyDecorator;
  Put: TargetedResourceActionDecorator;
  Post: TargetedResourceActionDecorator;
  Get: TargetedResourceActionDecorator;
  Delete: TargetedResourceActionDecorator;
}