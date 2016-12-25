import { Resource, ResourceAction } from '../src/decorators';
import { 
  RequestMethod, 
  ResourceMethod,
  ResourceParamMethod,
  DefaultResource
} from '../src/common';

export interface Model {}

@Resource({
  path: '/test/:id',
  params: {
    id: '@id'
  }
})
export class TestResource extends DefaultResource<Model, Promise<Model>, Promise<Model[]>> {}