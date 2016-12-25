import * as URL from 'url-parse';

import { isFunction } from './utils';

import { 
  ResourceFetchClient, 
  ResponseContentType,
  Type,
  ParsedURL,
  ResourceRequest,
  ResourceRequestOptions,
  RESOURCE_METADATA_KEY,
  RESOURCE_ACTIONS_METADATA_KEY,
  ResourceActionMetadata,
  ResourceActionConfig,
  ResourceConfig,
  RequestMethod
} from './common';

export class ResourceFactory {
  private cache = new Map<Type<any>, any>();
  
  constructor(private client: ResourceFetchClient) {}

  get<T>(ResourceCtor: Type<T>): T {
    if (this.cache.has(ResourceCtor)) {
      return this.cache.get(ResourceCtor) as T;
    }
    
    const config: ResourceConfig|undefined = Reflect.getOwnMetadata(RESOURCE_METADATA_KEY, ResourceCtor);  

    if (!config) {
      throw new Error('Resource given is not a confiugured resource');
    }

    const resource = new ResourceCtor(this.client, this);

    if (config.defaults !== false) {
      this.createDefaultInterface(resource, config);
    }

    const actions: ResourceActionMetadata[]|undefined = Reflect.getOwnMetadata(RESOURCE_ACTIONS_METADATA_KEY, ResourceCtor);

    if (actions) {
      for (const action of actions) {
        this.createAction<T>(resource, action.key, action.config, config);
      }
    }

    this.cache.set(ResourceCtor, resource);

    return resource;
  }

  protected createDefaultInterface<T>(resource: T, config: ResourceConfig): void {
    this.createAction(resource, 'create', {
      method: RequestMethod.POST
    }, config);

    this.createAction(resource, 'update', {
      method: RequestMethod.PUT,
    }, config);

    this.createAction(resource, 'delete', {
      method: RequestMethod.DELETE
    }, config);

    this.createAction(resource, 'get', {
      method: RequestMethod.GET
    }, config);

    this.createAction(resource, 'list', {
      method: RequestMethod.GET
    }, config);
  }

  protected createAction<T>(
    resource: T, 
    key: string, 
    config: ResourceActionConfig,
    resConfig: ResourceConfig
  ): void {
    const parsedURL = this.getParsedURL(config, resConfig);
    const factory = this;
    const client = this.client;

    Object.defineProperty(resource, key, {
      enumerable: false,
      writable: true,
      configurable: true,
      value: action
    });

    function action(payloadOrParams: any, maybeParams?: any, options: any = {}): any {
      let params, payload = null;
      let url = new URL(parsedURL.href);
      
      if (config.method !== RequestMethod.POST && config.method !== RequestMethod.PUT) {
        params = payloadOrParams;
        options = maybeParams;
      } else {
        params = maybeParams;
        payload = payloadOrParams;
      }

      params = Object.assign({}, resConfig.params, config.params, params);

      let populatedPath = url.pathname;
      let query: {[key:string]: any} = {};

      for (const paramKey of Object.keys(params)) {
        const param = params[paramKey];
        const pathMatcher = new RegExp(`/:${paramKey}`);

        if (pathMatcher.test(url.pathname)) {
          let value;
          
          if (typeof param === 'string' && param.charAt(0) === '@' && payload) {
            value = payload[param.slice(1)];
          } else {
            value = param;
          }
          
          populatedPath = populatedPath.replace(pathMatcher, `/${factory.encodeParam(value)}`);
        } else {
          query[paramKey] = param;
        }
      }

      url.set('pathname', populatedPath);

      const queryString = factory.serializeQuery(query);
      const sendRequest = factory.resolveClientMethod(config.method);
      const req: ResourceRequest<any> = {
        url,
        search: query,
        withCredentials: Boolean(options.withCredentials),
        body: payload,
        headers: options.headers || {},
        method: config.method,
        responseType: options.hasOwnProperty('responseType') ? options.responseType : ResponseContentType.JSON,
        path: queryString ? `${url.href}?${queryString}` : url.href
      };

      return sendRequest(req);
    }
  }

  protected encodeParam(value: any): string {
    return isFunction(this.client.encodeParam)
      ? this.client.encodeParam(value)
      : encodeURIComponent(value);
  }

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

  protected resolveClientMethod(method: RequestMethod): (req: ResourceRequest<any>) => any {
    switch (method) {
      case RequestMethod.GET: return this.client.get.bind(this.client);
      case RequestMethod.POST: return this.client.post.bind(this.client);
      case RequestMethod.DELETE: return this.client.delete.bind(this.client);
      case RequestMethod.PUT: return this.client.put.bind(this.client);
    }

    throw new Error(`${method} is not a valid request method`);
  }

  protected getParsedURL(config: ResourceActionConfig, resConfig: ResourceConfig): ParsedURL {
    const parsedURL = new URL(resConfig.path);
    const { pathname } = parsedURL;
    let segments = pathname.split('/');

    if (config.path) {
      let actionPath = (new URL(config.path)).pathname;
      let actionSegments = actionPath.split('/');

      if (actionSegments[0] === '') {
        actionSegments.shift();
      }

      segments.push(...actionSegments);
    }

    return parsedURL;
  }
}