Resticle
========

REST resources made easy.

Usage
-----

Define a resource.

```typescript
import { Resource, ResourceAction, RequestMethod, ResourceParams } from '@resticle/core';

@Resource({
  path: '/user/:id',
  params: {
    id: '@id'
  }
})
export class UserResource {
  // Define a resource action. The method is required.
  @ResourceAction({
    method: RequestMethod.POST
  })
  create: (data: UserModel) => Promise<UserModel>;

  // Or you can use the shorthand for a resource method.
  @ResourceAction.Put()
  update: (data: UserModel, params?: ResourceParams) => Promise<UserModel>;

  @ResourceAction.Get()
  get: (params?: ResourceParams) => Promise<UserModel>;
}
```

Create a `ResourceFactory` with the desired client. Resticle is agnostic of the implementation
used to make the requests. This allows it to be adpated to any framework or client. We'll
use the already created `fetch-client`.

```typescript
import { FetchResourceClient } from '@resticle/fetch-client';
import { ResourceFactory } from '@resticle/core';

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
userResource.get({ id: 123 }).then(user => {
  console.log(user);
});
```