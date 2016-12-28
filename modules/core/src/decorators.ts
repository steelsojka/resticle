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

export function Resource(config: ResourceConfig): ClassDecorator {
  return function resourceDecorator(target: typeof Resource): void {
    Reflect.defineMetadata(RESOURCE_METADATA_KEY, config, target);
  }
}

function setActionDefaults(config: ResourceActionConfig): ResourceActionConfig {
  if (!isBoolean(config.transform)) {
    config.transform = config.method !== RequestMethod.DELETE;
  }

  config.isArray = Boolean(config.isArray);

  return config;
}

function getOrCreate<T>(key: string, value: T, target: any): T {
  const metadata = Reflect.getOwnMetadata(key, target);

  return metadata ? metadata : value;
}

function createShorthandMethodDecorator(type: RequestMethod): TargetedResourceActionDecorator {
  return function(config: TargetedResourceActionConfig = {}): PropertyDecorator {
    return Action(Object.assign(config, { method: type }));
  }    
}

export const Post = createShorthandMethodDecorator(RequestMethod.POST);
export const Put = createShorthandMethodDecorator(RequestMethod.PUT);
export const Delete = createShorthandMethodDecorator(RequestMethod.DELETE);
export const Get = createShorthandMethodDecorator(RequestMethod.GET);
