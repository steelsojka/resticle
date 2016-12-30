import { ResourceFactory, ResourceFetchClient } from 'resticle';

import { HttpResourceClient } from './HttpResourceClient';

/**
 * Creates the resource factory using the configured client.
 * @export
 * @param {ResourceFetchClient} client
 * @returns {ResourceFactory}
 */
export function factory(client: ResourceFetchClient): ResourceFactory {
  return new ResourceFactory(client);
}