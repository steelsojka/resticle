import { ResourceFactory } from 'resticle';

import { HttpResourceClient } from './HttpResourceClient';

export function factory(client: HttpResourceClient): ResourceFactory {
  return new ResourceFactory(client);
}