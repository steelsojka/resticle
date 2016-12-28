import { expect } from 'chai';

import { ResourceFactory } from '../src/ResourceFactory';
import { TestResource } from './TestResource';
import { TestResourceClient } from '../../test-client/src';

const client = new TestResourceClient();
const resourceFactory = new ResourceFactory(client, {
  rootPath: 'http://myspace.com/rest'
});

describe('resticle', () => {
  let resource: TestResource;
  
  beforeEach(() => {
    resource = resourceFactory.get(TestResource);
  });

  afterEach(() => {
    client.verifyNoOutstandingRequests();
    client.reset();
  });
  
  describe('path population', () => {
    it('should populate the path the id', async () => {
      resource.get({ id: 123 });
      await client.flush();
      
      client.expectGET({
        path: 'http://myspace.com/rest/test/123'
      });
    });    
    
    it('should omit the path id', async () => {
      resource.list();
      await client.flush();
      
      client.expectGET({
        path: 'http://myspace.com/rest/test'
      });
    });    

    it('should add on query params', async () => {
      resource.list({ blorg: true, amount: 123 });
      await client.flush();
      
      client.expectGET({
        path: 'http://myspace.com/rest/test?blorg=true&amount=123'
      });
    });    

    it('should populate multiple path params', async () => {
      resource.postWithParam({ id: 123, name: 'Steven' });
      await client.flush();
      
      client.expectPOST({
        path: 'http://myspace.com/rest/test/123/Steven/post'
      });
    });    

    it('should omit multiple path params', async () => {
      resource.postWithParam({ name: 'Steven' });
      await client.flush();
      
      client.expectPOST({
        path: 'http://myspace.com/rest/test/undefined/Steven/post'
      });
    });    
  });
});
