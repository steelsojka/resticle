import { isFunction, clone, isObject, isString } from './utils';

import { 
  ResourceFetchClient, 
  ResponseContentType,
  Type,
  ResourceRequest,
  RequestOptions,
  RESOURCE_METADATA_KEY,
  RESOURCE_ACTIONS_METADATA_KEY,
  ResourceActionMetadata,
  ResourceActionConfig,
  ResourceConfig,
  RequestMethod,
  FactoryOptions
} from './common';
import { getOrCreateMetadata } from './utils';
import { Action } from './decorators';

const PayloadMethods = new Set<RequestMethod>([
  RequestMethod.PATCH,
  RequestMethod.POST,
  RequestMethod.PUT  
]);

/**
 * Manages the creation and configuration of resources.
 * @class ResourceFactory
 * @export
 */
export class ResourceFactory {
  protected cache = new Map<Type<any>, any>();
  protected pathParamMatcher = /\/:[a-zA-Z0-9]*/g;
  
  private _rootPath: string|undefined;
  private _defaultHeaders: {[key: string]: any}|undefined;

  /**
   * Creates a new ResourceFactory using the desired client.
   * @param {ResourceFetchClient} client The client to use with this resource factory.
   * @param {FactoryOptions} [options={}] Configuration options for the factory.
   */
  constructor(
    private client: ResourceFetchClient, 
    options: FactoryOptions = {}
  ) {
    this.rootPath = options.rootPath;
    this.defaultHeaders = options.defaultHeaders;
  }

  /**
   * Default headers to apply to every request.
   * @type {{[key: string]: any}}
   */
  get defaultHeaders(): {[key: string]: any} {
    return this._defaultHeaders || {};
  }

  set defaultHeaders(value: {[key: string]: any}) {
    if (isObject(value) && !Array.isArray(value)) {
      this._defaultHeaders = value;
    }
  }

  /**
   * Root path to prefix every path with.
   * @type {string}
   */
  get rootPath(): string {
    return this._rootPath || '';
  }

  set rootPath(value: string) {
    if (isString(value)) {
      this._rootPath = value;  
    }
  }

  /**
   * Gets or creates a resource. Uses the defined metadata to generate the defined actions.
   * Resources are singletons per factory so multiple calls with the same resource constructor
   * will return the same instance.
   * @template T The resource class type.
   * @param {Type<T>} ResourceCtor The resource constructor.
   * @returns T
   */
  get<T>(ResourceCtor: Type<T>): T {
    if (this.cache.has(ResourceCtor)) {
      return this.cache.get(ResourceCtor) as T;
    }
    
    const config: ResourceConfig|undefined = Reflect.getOwnMetadata(RESOURCE_METADATA_KEY, ResourceCtor);  

    if (!config) {
      throw new Error('Resource given is not a configured resource');
    }

    const resource = new ResourceCtor(this.client, {
      createAction: (key: string, aConf: ResourceActionConfig) => {
        Action(aConf)(ResourceCtor.prototype, key);
      }
    });

    const actions: ResourceActionMetadata|undefined = Reflect.getOwnMetadata(RESOURCE_ACTIONS_METADATA_KEY, ResourceCtor.prototype);

    if (actions) {
      for (const key of Object.keys(actions)) {
        this.createAction<T>(config, resource, key, actions[key]);
      }
    }

    this.cache.set(ResourceCtor, resource);

    return resource;
  }

  /**
   * Creates an action for the resource.
   * @protected
   * @template T
   * @param {ResourceConfig} resConfig
   * @param {T} resource
   * @param {string} key
   * @param {ResourceActionConfig} config
   */
  protected createAction<T>(
    resConfig: ResourceConfig,
    resource: T, 
    key: string, 
    actionConfig: ResourceActionConfig
  ): void {
    let config = actionConfig;
    
    if (isFunction((<any>resource).actionCreated)) {
      config = (<any>resource).actionCreated(actionConfig);
    }
    
    const url = this.getParsedURL(config, resConfig);
    const factory = this;
    const client = this.client;

    Object.defineProperty(resource, key, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: action
    });

    function action(payloadOrParams: any, maybeParams: any = {}, options: any = {}): any {
      let params, payload = null;
      
      if ((PayloadMethods.has(config.method) && config.hasBody !== false) || config.hasBody) {
        params = maybeParams;
        payload = payloadOrParams;
      } else {
        params = payloadOrParams;
        options = maybeParams;
      }

      params = Object.assign({}, resConfig.params, config.params, params);

      let populatedPath = url;
      let query: {[key:string]: any} = {};

      for (const paramKey of Object.keys(params)) {
        const param = params[paramKey];
        const pathMatcher = new RegExp(`/:${paramKey}`);
        const isBodyParam = isString(param) && param.charAt(0) === '@';

        if (pathMatcher.test(url)) {
          let value;
          
          if (isBodyParam) {
            if (payload) {
              const value = factory.getBodyValue(payload, param.slice(1));
              const replacement = value != null ? `/${factory.encodeParam(value)}` : '';
              
              populatedPath = populatedPath.replace(pathMatcher, replacement);
            } else {
              populatedPath = populatedPath.replace(pathMatcher, '');
            }
          } else {
            populatedPath = populatedPath.replace(pathMatcher, param ? `/${factory.encodeParam(param)}` : '');
          }
        } else if (!isBodyParam) {
          query[paramKey] = param;
        }
      }
      
      let fullUrl = populatedPath;

      if (factory.rootPath) {
        fullUrl = `${factory.rootPath}${fullUrl}`;
      }

      const queryString = factory.serializeQuery(query);

      if (queryString) {
        fullUrl = `${fullUrl}?${queryString}`;
      }

      const sendRequest = factory.resolveClientMethod(config);
      const req: ResourceRequest<any> = {
        url: fullUrl,
        search: query,
        withCredentials: Boolean(options.withCredentials),
        body: payload,
        headers: Object.assign({}, factory.defaultHeaders, options.headers),
        method: config.method,
        responseType: options.hasOwnProperty('responseType') ? options.responseType : ResponseContentType.JSON,
        path: populatedPath,
        action: clone(config),
        options: clone(options)
      };

      return factory.client.subscribe(sendRequest(req), res => {
        return factory.processTransform(res, resource, config);
      });
    }
  }

  /**
   * Processes the resources transform method if it exists.
   * @protected
   * @param {*} res The response data.
   * @param {*} resource The resource.
   * @param {ResourceActionConfig} actionConfig The config for the action.
   * @returns {*} The transformed data.
   */
  protected processTransform(res: any, resource: any, actionConfig: ResourceActionConfig): any {
    const hasTransform = actionConfig.transform && isFunction(resource.transform);
    
    if (actionConfig.isArray) {
      if (!Array.isArray(res)) {
        throw new Error(`Expected array from action. Got ${typeof res}.`);
      }

      return hasTransform ? res.map(v => resource.transform(v)) : res;
    }

    return hasTransform ? resource.transform(res) : res;
  }

  /**
   * Encodes a param. This can be overridden by the client by providing the `encodeParam` hook.
   * @protected
   * @param {*} value The value to encode.
   * @returns {string}
   */
  protected encodeParam(value: any): string {
    return isFunction(this.client.encodeParam)
      ? this.client.encodeParam(value)
      : encodeURIComponent(value);
  }

  /**
   * Serializes the query object. Thie can be overridden by the client by providing the `serializeQuery` hook.
   * @protected
   * @param {{[key: string]: any}} query
   * @returns {string}
   */
  protected serializeQuery(query: {[key: string]: any}): string {
    if (isFunction(this.client.serializeQuery)) {
      return this.client.serializeQuery(query);
    }
    
    return Object.keys(query)
      .reduce((result, key) => {
        if (Array.isArray(query[key])) {
          result.push(...query[key].map((val, i) => `${this.encodeParam(key)}[${i}]=${this.encodeParam(val)}`));
        }  else {
          result.push(`${this.encodeParam(key)}=${this.encodeParam(query[key])}`);
        }

        return result;
      }, [])
      .join('&');
  }

  /**
   * Resolves a client method from a RequestMethod.
   * @protected
   * @param {RequestMethod} method
   * @returns {(req: ResourceRequest<any>) => any}
   */
  protected resolveClientMethod(config: ResourceActionConfig): (req: ResourceRequest<any>) => any {
    if (isFunction(this.client.resolveMethod)) {
      const resolved = this.client.resolveMethod(config);

      if (isFunction(resolved)) {
        return resolved;
      }
    }
    
    switch (config.method) {
      case RequestMethod.GET: return this.client.get.bind(this.client);
      case RequestMethod.POST: return this.client.post.bind(this.client);
      case RequestMethod.DELETE: return this.client.delete.bind(this.client);
      case RequestMethod.PUT: return this.client.put.bind(this.client);
    }

    throw new Error(`${config.method} is not a valid request method`);
  }

  /**
   * Gets a value from an object and a path.
   * @protected
   * @param {*} body
   * @param {string} path
   * @returns {*}
   */
  protected getBodyValue(body: any, path: string): any {
    let next = body;
    let segments = path.split('.');
    let index = 0;
    let length = segments.length;

    while (next != null && index < length) {
      next = next[segments[index++]];
    }

    return (index && index === length) ? next : undefined;
  }

  /**
   * Parses the resource and action urls to make a single URL for the action being performed.
   * @protected
   * @param {ResourceActionConfig} config
   * @param {ResourceConfig} resConfig
   * @returns {string}
   */
  protected getParsedURL(config: ResourceActionConfig, resConfig: ResourceConfig): string {
    let result = resConfig.path;

    if (config.path) {
      result += config.path;
    }

    return result;
  }
}