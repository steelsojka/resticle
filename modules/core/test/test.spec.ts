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

resource.update({ group: 546, id: 123 }, { include: ['name', 'face'], pizza: false });