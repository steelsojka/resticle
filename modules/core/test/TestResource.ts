import { Resource, ResourceAction } from '../src/decorators';
import { 
  RequestMethod, 
  ResourceMethod,
  ResourceParamMethod,
  ResourceParams,
  DefaultResource
} from '../src/common';

export interface Model {}

@Resource({
  path: '/test/:id',
  defaults: false,
  params: {
    id: '@id'
  }
})
export class TestResource {
  @ResourceAction({
    method: RequestMethod.PUT,
    path: '/charge'
  })
  charge: ResourceMethod<Model, Promise<Model>>

  @ResourceAction.Put({
    path: '/refund'  
  })
  refund: ResourceMethod<Model, Promise<Model>>
  
  @ResourceAction.Get()
  get: ResourceParamMethod<Promise<Model>>
}