import { Resource, ResourceAction } from './decorators';
import { 
  RequestMethod, 
  ResourceMethod,
  ResourceParamMethod
} from './common';

export interface Model {}

@Resource({
  path: '/test/:id',
  params: {
    id: '@id'
  }
})
export class TestResource {
  get: ResourceParamMethod<Model>;
  list: ResourceParamMethod<Model[]>;
  create: ResourceMethod<Model, Model>;
  update: ResourceMethod<Model, Model>;
  delete: ResourceParamMethod<Model>;
}