import { Resource, ResourceAction } from '../src/decorators';
import { 
  RequestMethod, 
  ResourceMethod,
  ResourceParamMethod,
  ResourceParams,
  ResourceTransform,
  DefaultResource
} from '../src/common';

export class Model {
  constructor(res: any) {}
}

@Resource({
  path: '/test/:id',
  defaults: false,
  params: {
    id: '@id'
  }
})
export class TestResource implements ResourceTransform<Model> {
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

  @ResourceAction.Get({
    isArray: true
  })
  list: ResourceParamMethod<Promise<Model[]>>

  transform(res: any): Model {
    return new Model(res);
  }
}