import { ResourceFactory } from '../src/ResourceFactory';
import { TestResource } from './TestResource';

const resourceFactory = new ResourceFactory({
  get(req) {
    return req.action.isArray ? Promise.resolve([{}, {}]) : Promise.resolve({});
  },
  post(req) {
    return Promise.resolve({});
  },
  put(req) {
    return Promise.resolve({});
  },
  delete() {
    return Promise.resolve({});
  },
  subscribe(reqResult: Promise<any>, callback: (val: any) => any): Promise<any> {
    return reqResult.then(val => callback(val));
  }
});

describe('test', () => {
  it('should do something', async () => {
    const resource = resourceFactory.get(TestResource);

    console.log(await resource.charge({ group: 546, id: 123 }, { amount: 59.99 }));
    
    // resource.refund({ group: 546, id: 123 }, { amount: 67.99 });
    // resource.get({ id: 123 });
    console.log(await resource.list());
  });  
});
