import { ResourceFactory } from '../src/ResourceFactory';
import { TestResource } from './TestResource';

const resourceFactory = new ResourceFactory({
  get(req) {
    console.log(req);
  },
  post(req) {
    console.log(req);
  },
  put(req) {
    console.log(req);
  },
  delete() {
    
  }
});

const resource = resourceFactory.get(TestResource);

resource.charge({ group: 546, id: 123 }, { amount: 59.99 });
resource.refund({ group: 546, id: 123 }, { amount: 67.99 });
resource.get({ id: 123 });