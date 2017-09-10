import { expect } from 'chai';
import { TestResourceClient } from 'resticle-test-client';

import { ResourceFactory, ResponseContentType } from '../src';
import { TestResource, Model } from './TestResource';

const client = new TestResourceClient();
const resourceFactory = new ResourceFactory(client, {
  rootPath: '/rest'
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
        url: '/rest/test/123'
      });
    });    
    
    it('should omit the path id', async () => {
      resource.list();
      await client.step([]);
      
      client.expectGET({
        url: '/rest/test'
      });
    });    

    it('should add on query params', async () => {
      resource.list({ blorg: true, amount: 123 });
      await client.step([]);
      
      client.expectGET({
        url: '/rest/test?blorg=true&amount=123'
      });
    });    

    it('should populate multiple path params', async () => {
      resource.postWithParam({ id: 123, name: 'Steven' });
      await client.flush();
      
      client.expectPOST({
        url: '/rest/test/123/Steven/post'
      });
    });    

    it('should omit multiple path params', async () => {
      resource.postWithParam({ name: 'Steven' });
      await client.flush();
      
      client.expectPOST({
        url: '/rest/test/Steven/post'
      });
    });    
    
    it('should prepopulate params', async () => {
      resource.putWithParam({ id: 999 });
      await client.flush();
      
      client.expectPUT({
        url: '/rest/test/999/refund/123'
      });
    });    

    it('should populate with path segment params', async () => {
      resource.postWithPath({ account: { id: { value: 999 } } });
      await client.flush();
      
      client.expectPOST({
        url: '/rest/test/999'
      });
    });    

    it('should prepopulate query params', async () => {
      resource.prepopulatedSearch({ id: 123 });
      await client.flush();
      
      client.expectGET({
        url: '/rest/test/123?test=true'
      });
    });    

    it('should ignore body params when not present or in path', async () => {
      resource.ignoreBodyParamNotInPath();

      await client.flush();
      
      client.expectGET({
        url: '/rest/test',
        search: {}
      });
    });
  });

  describe('transform', () => {
    it('should transform the data', async () => {
      const promise = resource.getWithTransform();
      
      client.flush();
      
      const result = await promise;
      
      expect(result).to.be.an.instanceOf(Model);
    });    

    it('should transform the array data', async () => {
      const promise = resource.getWithArrayTransform();
      
      client.step([{}, {}]);
      
      const result = await promise;
      
      expect(result[0]).to.be.an.instanceOf(Model);
      expect(result[1]).to.be.an.instanceOf(Model);
    });    
    
    it('should not transform the data', async () => {
      const promise = resource.getWithoutTransform();
      const data = {};
      
      client.step(data);
      
      const result = await promise;
      
      expect(result).not.to.be.an.instanceOf(Model);
      expect(result).to.equal(data);
    });    
  });

  describe('request options', () => {
    it('should use headers', async () => {
      resource.get({ id: 123 }, {
        withCredentials: true, 
        headers: {
          'User-Id': 'blorg',
          'auth': 1234
        }
      });
      
      await client.flush();

      client.expectGET({
        withCredentials: true,
        headers: {
          'User-Id': 'blorg',
          'auth': 1234
        }
      });
    });  
  });

  describe('default headers', () => {
    it('should use default headers', async () => {
      resourceFactory.defaultHeaders = {
        testHeader: true  
      };
      
      resource.get({ id: 123 }, {
        withCredentials: true, 
        headers: {
          'User-Id': 'blorg',
          'auth': 1234
        }
      });
      
      await client.flush();

      client.expectGET({
        withCredentials: true,
        headers: {
          'User-Id': 'blorg',
          'auth': 1234,
          'testHeader': true
        }
      });
    });  
  });
});
