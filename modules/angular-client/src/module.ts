import { NgModule } from '@angular/core';
import { ResourceFactory } from 'resticle';

import { HttpResourceClient } from './HttpResourceClient';
import { HttpResourcePromiseClient } from './HttpResourcePromiseClient';
import { factory } from './factory';
import { HTTP_RESOURCE_CLIENT } from './common';

@NgModule({
  providers: [
    HttpResourceClient,
    HttpResourcePromiseClient,
    { provide: ResourceFactory, useFactory: factory, deps: [ HTTP_RESOURCE_CLIENT ] }
  ]
})
export class AngularClientModule {}