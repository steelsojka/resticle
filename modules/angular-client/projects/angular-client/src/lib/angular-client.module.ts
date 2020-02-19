import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { ResourceFactory, ResourceFetchClient } from 'resticle';

import { AngularHttpResourceClient } from './angular-http-resource-client.service';
import { HTTP_RESOURCE_CLIENT } from './common';

export function angularHttpResourceClientFactory(client: ResourceFetchClient): ResourceFactory {
  return new ResourceFactory(client);
}

@NgModule({
  imports: [
    HttpClientModule 
  ]
})
export class AngularClientModule {
  static forRoot(): ModuleWithProviders<AngularClientModule> {
    return {
      ngModule: AngularClientModule,
      providers: [
        AngularHttpResourceClient,
        { provide: HTTP_RESOURCE_CLIENT, useExisting: AngularHttpResourceClient },
        { provide: ResourceFactory, useFactory: angularHttpResourceClientFactory, deps: [ HTTP_RESOURCE_CLIENT ] }
      ]
    }
  }
}
