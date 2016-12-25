import { 
  TargetedResourceActionConfig,
  RESOURCE_ACTIONS_METADATA_KEY,
  RESOURCE_METADATA_KEY,
  ResourceConfig,
  RequestMethod,
  ResourceActionConfig,
  ResourceActionMetadata,
  RootResourceActionDecorator
} from './common';

const methodToType = {
  Delete: RequestMethod.DELETE,
  Get: RequestMethod.GET,
  Post: RequestMethod.POST,
  Put: RequestMethod.PUT
};

export const ResourceAction = <RootResourceActionDecorator>function ResourceAction(config: ResourceActionConfig): PropertyDecorator {
  return function resourceActionDecorator(target: typeof Resource, key: string): void {
    let actions = getOrCreate<ResourceActionMetadata[]>(RESOURCE_ACTIONS_METADATA_KEY, [], target);

    actions.push({ key, config });

    Reflect.defineMetadata(RESOURCE_ACTIONS_METADATA_KEY, actions, target);
  }
} 

export function Resource(config: ResourceConfig): ClassDecorator {
  return function resourceDecorator(target: typeof Resource): void {
    Reflect.defineMetadata(RESOURCE_METADATA_KEY, config, target);
  }
}

function getOrCreate<T>(key: string, value: T, target: any): T {
  const metadata = Reflect.getOwnMetadata(key, target);

  return metadata ? metadata : value;
}

function createShorthandMethodDecorator(type: RequestMethod): (config: ResourceActionConfig) => PropertyDecorator {
  return function(config: TargetedResourceActionConfig = {}): PropertyDecorator {
    return ResourceAction(Object.assign(config, { method: type }));
  }    
}

for (const key of Object.keys(methodToType)) {
  ResourceAction[key] = createShorthandMethodDecorator(methodToType[key]);
}