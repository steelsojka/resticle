export const RESOURCE_METADATA_KEY = 'resource:config';
export const RESOURCE_ACTIONS_METADATA_KEY = 'resource:action-config';

export enum RequestMethod {
  POST,
  PUT,
  DELETE,
  GET,
  HEAD,
  PATCH  
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

export interface TargetedResourceActionConfig {
  /**
   * The action path. This string is appended to the resource path.
   */
  path?: string;  
  /**
   * Whether the action is expecting an array of items.
   */
  isArray?: boolean;
  /**
   * Whether the action should run through the custom transform function.
   * This is `true` by default for actions except actions with methods of DELETE.
   */
  transform?: boolean;
  /**
   * A map of params to pre-populate with or to instruct the action to grab from the
   * request body.
   */
  params?: {[key: string]: any};
  /**
   * Whether the action signature should accept a body as it's first argument.
   */
  hasBody?: boolean;
}

export interface ResourceActionConfig extends TargetedResourceActionConfig {
  /**
   * The request method of the action.
   */
  method: RequestMethod;
}

export interface ResourceConfig {
  /**
   * The root path of the resource. Resource path variables are defined as `user/:name`.
   * Name maps to the `name` key define in the params of the request. 
   */
  path: string;
  /**
   * A map of params to pre-populate with or to instruct the action to grab from the
   * request body.
   */
  params?: RequestParams;
}

export interface ResourceActionMetadata {
  [key: string]: ResourceActionConfig;
}

export interface Type<T> {
  new (...args: any[]): T;
}

export interface ResourceRequest<T> {
  /**
   * The request method of the action.
   */
  method: RequestMethod;
  /**
   * The resulting path to make the request to. This includes are path params populated
   * as well as any query string parameters encoded.
   */
  url: string;
  /**
   * The path portion of the URL before query params or root path.
   */
  path: string;
  /**
   * A key/value pair of header properties.
   */
  headers: {[key: string]: any};
  /**
   * A key/value pair of query parameters.
   */
  search: {[key: string]: any};
  /**
   * Whether to include credentials.
   */
  withCredentials: boolean;
  /**
   * The response type of the request.
   */
  responseType: ResponseContentType;
  /**
   * The body of the request. Only applies to POST and PUT methods.
   */
  body: T;
  /**
   * A clone of the action configuration. The configuration can not be modfied from 
   * this object since it is a deep clone of the configuration.
   */
  action: ResourceActionConfig;
  /**
   * Options for the request.
   */
  options: RequestOptions;
}

export interface RequestOptions {
  /**
   * A key/value pair of header properties.
   */
  headers?: {[key: string]: any};
  /**
   * Whether to include credentials.
   */
  withCredentials?: boolean;
  /**
   * The response type of the request.
   */
  responseType?: ResponseContentType;
}


/**
 * A map of params to pre-populate with or to instruct the action to grab from the
 * request body.
 */
export interface RequestParams {
  [key: string]: any;
}

/**
 * The interface all clients must implement. This allows for different clients to
 * be used for the same resources.
 * 
 * Note that the client determines the return type for the resource (Promise, Observable, etc...). 
 * Since this is the case our resources can only define one return type for the action.
 * It's generally a good idea to stick to one type (Promises or Observables but not both).
 * 
 * If a client returns Promises and you would like to use observables you can extend the
 * client and wrap each response in an Observable.
 */
export interface ResourceFetchClient {
  /**
   * A hook for serializing the query string. If this method is not provided
   * the default serializer will be used.
   * @param {{[key: string]: any}} query The query map.
   * @returns {string}
   */
  serializeQuery?: (query: {[key: string]: any}) => string;
  
  /**
   * A custom param encoder. If not provided then `encodeURIComponent` is used.
   * @param {string} value The value.
   * @returns {string}
   */
  encodeParam?: (value: string) => string;
  
  /**
   * Performs a `GET` request for the client.
   * @param {ResourceRequest<any>} req The resource request.
   * @returns {any} The async return type (Promise, Observable, etc...)
   */
  get(req: ResourceRequest<any>): any;
  
  /**
   * Performs a `POST` request for the client.
   * @param {ResourceRequest<any>} req The resource request.
   * @returns {any} The async return type (Promise, Observable, etc...)
   */
  post(req: ResourceRequest<any>): any;

  /**
   * Performs a `DELETE` request for the client.
   * @param {ResourceRequest<any>} req The resource request.
   * @returns {any} The async return type (Promise, Observable, etc...)
   */
  delete(req: ResourceRequest<any>): any;

  /**
   * Performs a `PUT` request for the client.
   * @param {ResourceRequest<any>} req The resource request.
   * @returns {any} The async return type (Promise, Observable, etc...)
   */
  put(req: ResourceRequest<any>): any;

  /**
   * This method tells the `ResourceFactory` how to subscribe to the async container
   * used by the client. For instance if a client is using Observables this method take
   * an Observable and a callback and subscribe to the observable using the callback.
   * 
   * Note the this behaves how a Promise would in terms where the returned value from the callback should
   * be used as the new value.
   * @param {any} res The async response type (Promise, Observable, etc...)
   * @param {(res: any) => any} callback The callback to be subscribed with.
   * @returns {any} The async return type with the mapped value.
   */
  subscribe(res: any, callback: (res: any) => any): any;
}

/**
 * An interface for an action method that only accepts params and request options.
 * @template R The return type of the action.
 */
export interface ActionMethod<R> {
  (params?: RequestParams, options?: RequestOptions): R;
}

/**
 * An interface for an action method that accepts a body, params and request options.
 * @template T The model value type.
 * @template R The returncommon type of the action.
 */
export interface ActionDataMethod<T, R> {
  (resource: T, params?: RequestParams, options?: RequestOptions): R;
}

/**
 * An interface for a resource that has a transformer for each item.
 * @template T The model value type.
 */
export interface ResourceTransform<T> {
  /**
   * Transforms a model value into another value. This is useful if the plain objects
   * from the response need to be mapped to model classes. If the return value is an array
   * and the action is flagged as an array then each value of the array will be transformed.
   * @param {any} res A data item returned from the request.
   * @returns {T} The model value.
   */
  transform(res: any): T;
}

export interface TargetedResourceActionDecorator {
  (config?: TargetedResourceActionConfig): PropertyDecorator;
}

/**
 * An interface given to the resource when instantiated used
 * to dynamically create actions.
 */
export interface DynamicResourceFactory<T> {
  /**
   * Creates an action method. This is the same as annotating a method
   * except it is bound to the parent resource config.
   * @param {string} key The name of the action method being created.
   * @param {ResourceActionConfig} config The action configuration.
   */
  createAction(key: string, config: ResourceActionConfig): void;
}

/**
 * Options used for configuraing the resource factory.
 */
export interface FactoryOptions {
  /**
   * The root path that will be prepended onto all paths.
   */
  rootPath?: string;
  /**
   * A set of default headers to apply to every request.
   */
  defaultHeaders?: {[key:string]: any};
}