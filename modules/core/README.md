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
}
```