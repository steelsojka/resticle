Resticle Angular Client
=======================

A Resource client using Angular's HTTP service.

Setup
-----

This client exports an Angular module that is preconfigured with a factory
to generate the `ResourceFactory`. This module comes with two different clients.
One that uses Observables returned from the HTTP service and one that uses
standard Promises. You must provide which one you would like to use by registering
it with the DI using the provided token.

```typescript
import { NgModule } from '@angular/core';
import { 
  AngularClientModule,
  HttpResourceClient,
  HTTP_RESOURCE_CLIENT  
} from 'resicle-angular-client';

@NgModule({
  imports: [
    AngularClientModule
  ],
  providers: [
    { provide: HTTP_RESOURCE_CLIENT, useClass: HttpResourceClient }
  ]
})
export class AppModule {}
```

**You're done!** The `ResourceFactory` can be injected and used like the below example.

```typescript
import { Inject, Injectable } from '@angular/core';
import { ResourceFactory } from 'resticle';

import { MyResource } from '../resources';

@Injectable()
export class MyService {
  constructor(
    @Inject(ResourceFactory) private resourceFactory: ResourceFactory
  ) {} 

  save(): Observable<any> {
    this.resourceFactory.get(MyResource).update();
  }
}
```

HTTP Interceptors
-----------------

You can register interceptor for the request or the reponse. These a registered through
the DI using specific tokens. Here's an example of an auth request interceptor.

```typescript
import { Inject } from '@angular/core';
import { RequestOptionsArgs } from '@angular/http';
import { HttpRequestInterceptor } from 'resticle-angular-client';

import { AuthService } from './Auth.service';

export class AuthRequestInterceptor {
  constructor(
    @Inject(AuthService) private authService: AuthService
  ) {}
  
  request(req: RequestOptionsArgs): Promise<RequestOptionsArgs> {
    // We can return promises to wait for something to happen before completing
    // the request.
    return new Promise(resolve => {
      // Status is an Observable that emits the auth status. Once subscribe upon
      // it will emit the last state of the auth (BehaviorSubject).
      // In this scenario we wait to send the request until we are fully authenticated.
      this.authService.status
        .first(status => status === 'AUTHENTICATED')
        .subscribe(() => {
          // Add the credentials to the headers of the request.
          req.headers.set('User', this.authService.user);
          req.headers.set('Auth-Token', this.authService.authToken);

          resolve(req);
        });
    });
  }
}
```

You can register this interceptor in our auth module.

```typescript
import { NgModule } from '@angular/core';
import { HTTP_REQUEST_INTERCEPTORS } from 'resticle-angular-client';

import { AuthRequestInterceptor } from './AuthRequestInterceptor';
import { AuthService } from './Auth.service';

@NgModule({
  providers: [{
    provide: HTTP_REQUEST_INTERCEPTORS,
    useClass: AuthRequestInterceptor,
    multi: true // This is required
  },
    AuthService
  ]
})
export class AuthModule {}
```
