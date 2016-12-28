import * as URL from 'url-parse';

import { isFunction, clone } from './utils';

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
  RequestMethod,
  FactoryOptions
} from './common';

export class ResourceFactory {
  protected cache = new Map<Type<any>, any>();
  protected pathParamMatcher = /\/:[a-zA-Z0-9]*/g;
  
  constructor(
    private client: ResourceFetchClient, 
    private options: FactoryOptions = {}
  ) {}

  get<T>(ResourceCtor: Type<T>): T {
    if (this.cache.has(ResourceCtor)) {
      return this.cache.get(ResourceCtor) as T;
    }
    
    const config: ResourceConfig|undefined = Reflect.getOwnMetadata(RESOURCE_METADATA_KEY, ResourceCtor);  

    if (!config) {
      throw new Error('Resource given is not a configured resource');
    }

    const resource = new ResourceCtor(this.client, {
      createAction: this.createAction.bind(this, config)
    });

    const actions: ResourceActionMetadata[]|undefined = Reflect.getOwnMetadata(RESOURCE_ACTIONS_METADATA_KEY, ResourceCtor.prototype);

    if (actions) {
      for (const action of actions) {
        this.createAction<T>(config, resource, action.key, action.config);
      }
    }

    this.cache.set(ResourceCtor, resource);

    return resource;
  }

  protected createAction<T>(
    resConfig: ResourceConfig,
    resource: T, 
    key: string, 
    config: ResourceActionConfig
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

    function action(payloadOrParams: any, maybeParams: any = {}, options: any = {}): any {
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
          
          if (typeof param === 'string' && param.charAt(0) === '@') {
            if (payload) {
              populatedPath = populatedPath.replace(pathMatcher, `/${factory.encodeParam(payload[param.slice(1)])}`);
            } else {
              populatedPath = populatedPath.replace(pathMatcher, '');
            }
          } else {
            populatedPath = populatedPath.replace(pathMatcher, `/${factory.encodeParam(param)}`);
          }
        } else {
          query[paramKey] = param;
        }
      }

      url.set('pathname', populatedPath);

      let fullPath = url.href;

      if (factory.options.rootPath) {
        fullPath = `${factory.options.rootPath}${fullPath}`;
      }

      const queryString = factory.serializeQuery(query);

      if (queryString) {
        fullPath = `${fullPath}?${queryString}`;
      }

      const sendRequest = factory.resolveClientMethod(config.method);
      const req: ResourceRequest<any> = {
        url,
        search: query,
        withCredentials: Boolean(options.withCredentials),
        body: payload,
        headers: options.headers || {},
        method: config.method,
        responseType: options.hasOwnProperty('responseType') ? options.responseType : ResponseContentType.JSON,
        path: fullPath,
        action: clone(config)
      };

      return factory.client.subscribe(sendRequest(req), res => {
        return factory.processTransform(res, resource, config);
      });
    }
  }

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

    parsedURL.set('pathname', segments.join('/'));

    return parsedURL;
  }
}