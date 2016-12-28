Resticle
========

REST resources made easy.

Usage
-----

Define a resource.

```typescript
import { Resource, Post, Put, Get, Delete, ResourceParams } from 'resticle';

@Resource({
  path: '/user/:id',
  params: {
    id: '@id'
  }
})
export class UserResource {
  @Post()
  create: (data: UserModel, params?: RequestParams, options?: RequestOptions) => Promise<UserModel>;

  @Put()
  update: (data: UserModel, params?: RequestParams) => Promise<UserModel>;

  @Get()
  get: (params?: RequestParams) => Promise<UserModel>;

  @Get({
    isArray: true
  })
  list: (params?: RequestParams) => Promise<UserModel>;

  @Delete()
  delete: (params?: RequestParams) => Promise<void>;
}
```

Create a `ResourceFactory` with the desired client. Resticle is agnostic of the implementation
used to make the requests. This allows it to be adpated to any framework or client. We'll
use the already created `fetch-client`.

```typescript
import { FetchResourceClient } from 'resticle-fetch-client';
import { ResourceFactory } from 'resticle';

import { UserResource } from './UserResource';

const client = new FetchResourceClient();

// The resource factory only needs to be created once per client.
// This will usally happen during an apps bootstrap phase.
const resourceFactory = new ResourceFactory(client);

// Get an instance of our resource. The resource factory will cache
// instances of resources so the resource will only get created the first
// time and all other times will receive the first instance.
const userResource = resourceFactory.get(UserResource);

// We can use all the actions we defined on our resource here.
// This call will use our fetch client under the hood.
userResource.get({ id: 123 }).then(user => {
  console.log(user);
});
```

### Configuring a Resource Action
When defining a resource action you can configure it.

```typescript
@Resource({
  path: '/user'
})
export class UserResource {
  @Get({
    path: '/:id/charge/:amount',
    params: {
      id: '@id'
    }
  })
  charge: (params?: RequestParams, options? :RequestOptions) => Promise<void>;
}

// We can then do this:
userResource.charge({ id: 123, amount: 59.99 }).then(() => {
  console.log('CHARGED!!!');
});

// This will request '/user/123/charge/59.99'
``` 

#### Action Arguments

Action methods that are of method 'GET' and 'DELETE' have a method signature of
`(params?: RequestParams, options?: RequestOptions) => any`

Action methods that are of method 'POST' and 'PUT' have a method signature of
`(model: T, params?: RequestParams, options?: RequestOptions) => any`

Post and Put methods have a data model that it takes as the first argument.

#### Transforms

A resource can contain a transform method used for transforming the response. This
is meant for the purpose of creating model instances from the return data. If the action
is flagged as an array each value in the array will be transformed.

```typescript
@Resource({
  path: '/user/:id'
})
export class UserResource implements ResourceTransform<UserModel> {
  @Get()
  get: ActionMethod<Promise<UserModel>>;
  
  @Get({
    isArray: true
  })
  list: ActionMethod<Promise<UserModel[]>>;

  @Get({
    // This will skip the transform method for this action.
    transform: false
  })
  getOther: ActionMethod<Promise<UserModel[]>>;
  
  transform(data: any): UserModel {
    return new UserModel(data);
  }
}
```

#### Dynamic Action Creation

You can create actions dynamically by using the resources provided
factory and client.

```typescript
@Resource({
  path: '/user/:id'
})
export class UserResource implements ResourceTransform<UserModel> {
  constructor(
    private client: ResourceFetchClient, 
    private factory: DynamicResourceFactory<UserResource>
  ) {
    factory.createAction(this, 'list', {
      method: RequestMethod.GET,
      isArray;
    });    
  }
  
  @Get()
  get: ActionMethod<Promise<UserModel>>;

  // You can also do custom behavior using the provided client.
  async doSomething(): Promise<UserModel> {
    const req = {
      path: 'http://myspace.com/rest/user',
      method: RequestMethod.POST,
      body: new UserModel()
    };
    
    return await this.client.post(req);
  }
}
```

#### Async Container

It's up to the client on what async container it uses (Promise). Most of the time
you will use promises, but you may want to use Observables. Since the client decides
this our resources can only be used with clients that use the same async container.
You can easily extend a client and wrap all responses in either promises or observables.

```typescript
export class FetchResourceObservableClient extends FetchResourceClient {
  get(req: ResourceRequest): Observable<any> {
    return this.toObservable(super.get(req));
  }

  post(req: ResourceRequest): Observable<any> {
    return this.toObservable(super.post(req));
  }

  put(req: ResourceRequest): Observable<any> {
    return this.toObservable(super.put(req));
  }

  delete(req: ResourceRequest): Observable<any> {
    return this.toObservable(super.delete(req));
  }

  protected toObservable(promise: Promise<any>): Observable<any> {
    return new Observable(subscriber => {
      promise.then(val => {
        subscriber.next(val);
        subscriber.complete();
      });
    });
  }
}
```
