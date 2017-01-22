import { Resource, Action, Put, Post, Get } from '../src/decorators';
import { 
  DynamicResourceFactory,
  RequestMethod, 
  ActionDataMethod,
  ActionMethod,
  RequestParams,
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
  charge: ActionDataMethod<Model, Promise<Model>>;

  @Put({
    path: '/refund/:amount',
    params: {
      amount: 123      
    }
  })
  putWithParam: ActionDataMethod<Model, Promise<Model>>;

  @Post({
    path: '/:name/post',
    params: {
      name: '@name'
    }
  })
  postWithParam: ActionDataMethod<Model, Promise<Model>>;

  @Post({
    params: {
      id: '@account.id.value'
    }
  })
  postWithPath: ActionDataMethod<Model, Promise<Model>>;
  
  
  @Get()
  get: ActionMethod<Promise<Model>>

  @Get({
    isArray: true
  })
  list: ActionMethod<Promise<Model[]>>

  @Get({
    params: {
      test: true
    }
  })
  prepopulatedSearch: ActionMethod<Promise<Model>>;

  @Get()
  getWithTransform: ActionMethod<Promise<Model>>;

  @Get({
    transform: false
  })
  getWithoutTransform: ActionMethod<Promise<Model>>;
  
  @Get({
    isArray: true
  })
  getWithArrayTransform: ActionMethod<Promise<Model[]>>;

  @Get({
    params: {
      blorg: '@blorg'
    }
  })
  ignoreBodyParamNotInPath: ActionMethod<Promise<Model>>;

  constructor(client: ResourceFetchClient, factory: DynamicResourceFactory<TestResource>) {
    factory.createAction('blorg', {
      method: RequestMethod.GET  
    });
  }

  transform(res: any): Model {
    return new Model(res);
  }
}