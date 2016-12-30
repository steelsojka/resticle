import { 
  TargetedResourceActionConfig,
  TargetedResourceActionDecorator,
  RESOURCE_ACTIONS_METADATA_KEY,
  RESOURCE_METADATA_KEY,
  ResourceConfig,
  RequestMethod,
  ResourceActionConfig,
  ResourceActionMetadata
} from './common';

import { isBoolean } from './utils';

/**
 * Decorator for defining an action on a resource.
 * @export
 * @param {ResourceActionConfig} config
 * @returns {PropertyDecorator}
 */
export function Action(config: ResourceActionConfig): PropertyDecorator {
  return function resourceActionDecorator(target: typeof Resource, key: string): void {
    let actions = getOrCreate<ResourceActionMetadata[]>(RESOURCE_ACTIONS_METADATA_KEY, [], target);

    actions.push({
      key, 
      config: setActionDefaults(config)
    });

    Reflect.defineMetadata(RESOURCE_ACTIONS_METADATA_KEY, actions, target);
  }
} 

/**
 * A decorator for defining a resource.
 * @export
 * @param {ResourceConfig} config
 * @returns {ClassDecorator}
 */
export function Resource(config: ResourceConfig): ClassDecorator {
  return function resourceDecorator(target: typeof Resource): void {
    Reflect.defineMetadata(RESOURCE_METADATA_KEY, config, target);
  }
}

/**
 * Sets the action defaults on the config.
 * @param {ResourceActionConfig} config
 * @returns {ResourceActionConfig}
 */
function setActionDefaults(config: ResourceActionConfig): ResourceActionConfig {
  if (!isBoolean(config.transform)) {
    config.transform = config.method !== RequestMethod.DELETE;
  }

  config.isArray = Boolean(config.isArray);

  return config;
}

/**
 * A helper that gets or creates metadata under a specific key.
 * @template T The return type.
 * @param {string} key
 * @param {T} value
 * @param {*} target
 * @returns {T}
 */
function getOrCreate<T>(key: string, value: T, target: any): T {
  const metadata = Reflect.getOwnMetadata(key, target);

  return metadata ? metadata : value;
}

/**
 * Creates a shorthand action decorator that is prebound to the specific method.
 * @param {RequestMethod} type
 * @returns {TargetedResourceActionDecorator}
 */
function createShorthandMethodDecorator(type: RequestMethod): TargetedResourceActionDecorator {
  return function(config: TargetedResourceActionConfig = {}): PropertyDecorator {
    return Action(Object.assign(config, { method: type }));
  }    
}

/**
 * A decorator that creates an action perbound to the 'POST' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Post = createShorthandMethodDecorator(RequestMethod.POST);
/**
 * A decorator that creates an action perbound to the 'PUT' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Put = createShorthandMethodDecorator(RequestMethod.PUT);
/**
 * A decorator that creates an action perbound to the 'DELETE' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Delete = createShorthandMethodDecorator(RequestMethod.DELETE);
/**
 * A decorator that creates an action perbound to the 'GET' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Get = createShorthandMethodDecorator(RequestMethod.GET);
/**
 * A decorator that creates an action perbound to the 'HEAD' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Head = createShorthandMethodDecorator(RequestMethod.HEAD);
/**
 * A decorator that creates an action perbound to the 'PATCH' method.
 * @param {ResourceActionConfig} config
 * @export
 * @type {PropertyDecorator}
 */
export const Patch = createShorthandMethodDecorator(RequestMethod.PATCH);
