import { NgModule } from '@angular/core';
import { ResourceFactory } from 'resticle';

import { HttpResourceClient } from './HttpResourceClient';
import { factory } from './factory';

@NgModule({
  providers: [
    HttpResourceClient,
    { provide: ResourceFactory, useFactory: factory, deps: [ HttpResourceClient ] }
  ]
})
export class AngularClientModule {}