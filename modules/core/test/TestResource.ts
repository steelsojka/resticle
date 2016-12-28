import { Resource, Action, Put, Post, Get } from '../src/decorators';
import { 
  DynamicResourceFactory,
  RequestMethod, 
  ResourceMethod,
  ResourceParamMethod,
  ResourceParams,
  ResourceTransform,
  ResourceFetchClient
} from '../src/common';

export class Model {
  constructor(res: any) {}
}

@Resource({
  path: '/test/:id',
  params: {
    id: '@id'
  }
})
export class TestResource implements ResourceTransform<Model> {
  @Action({
    method: RequestMethod.PUT,
    path: '/charge'
  })
  charge: ResourceMethod<Model, Promise<Model>>

  @Put({
    path: '/refund'
  })
  refund: ResourceMethod<Model, Promise<Model>>

  @Post({
    path: '/:name/post',
    params: {
      name: '@name'
    }
  })
  postWithParam: ResourceMethod<Model, Promise<Model>>
  
  @Get()
  get: ResourceParamMethod<Promise<Model>>

  @Get({
    isArray: true
  })
  list: ResourceParamMethod<Promise<Model[]>>

  constructor(client: ResourceFetchClient, factory: DynamicResourceFactory<TestResource>) {
    factory.createAction(this, 'blorg', {
      method: RequestMethod.GET  
    });
  }

  transform(res: any): Model {
    return new Model(res);
  }
}