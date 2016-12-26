import { ResourceFactory } from '@resticle/core';

import { HttpResourceClient } from './HttpResourceClient';

export function factory(client: HttpResourceClient): ResourceFactory {
  return new ResourceFactory(client);
}