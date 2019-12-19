import { expect, assert } from 'chai';
import { spy } from 'sinon';
import { Observable, of } from 'rxjs';
import { ResponseContentType, RequestMethod } from 'resticle';
import { HttpParams, HttpRequest } from '@angular/common/http';

import { HttpResourceClient } from './HttpResourceClient';
import {
  HttpRequestInterceptor,
  HttpRequestErrorInterceptor,
  HttpResponseInterceptor,
  HttpResponseErrorInterceptor,
  HttpResponseTransform
} from './common';

describe('HttpResourceClient', () => {
  let stubs, res;
  let client: HttpResourceClient;

  beforeEach(() => {
    res = {};
    stubs = {
      http: {
        request: () => of(res)
      },
      ngZone: {
        runGuarded: spy(fn => fn())
      }
    };
  });

  for (const method of ['post', 'get', 'put', 'delete']) {
    describe(`method ${method}`, () => {
      describe('when no interceptors', () => {
        let requestSpy: sinon.SinonSpy;
        let req;

        beforeEach(() => {
          req = {
            url: 'http://test.com',
            body: {},
            method: RequestMethod.GET,
            withCredentials: true,
            headers: {
              test: 'blorg'
            },
            search: {
              bam: 'boom'
            }
          };

          requestSpy = stubs.http.request = spy(stubs.http.request);
          client = new HttpResourceClient(stubs.http, [], []);
        });

        it('should return the result', () => {
          const $res = client[method](req) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(_res).to.equal(res);
          });
        });

        it('should make the request', () => {
          const $res = client[method](req) as Observable<any>;

          return $res.toPromise().then(() => {
            const reqArg = requestSpy.args[0][2] as Partial<HttpRequest<any>>;
            expect(requestSpy.called).to.be.true;
            expect(requestSpy.args[0][1]).to.equal('http://test.com');
            expect(requestSpy.args[0][0]).to.equal('get');
            expect(reqArg).to.be.an('object');
            expect(reqArg.url).to.equal('http://test.com');
            expect(reqArg.withCredentials).to.be.true;
            expect(reqArg.body).to.equal(req.body);
            expect(reqArg.headers.get('test')).to.equal('blorg');
            expect((<HttpParams>reqArg.params).get('bam')).to.equal('boom');
          });
        });
      });

      describe('when using a request interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;

        class RequestInterceptor implements HttpRequestInterceptor {
          request(req: any): any {
            const search = req.params as HttpParams;

            req.params = search.set('testy', 'boomf');

            return Promise.resolve(req);
          }
        }

        beforeEach(() => {
          const interceptor = new RequestInterceptor();

          requestSpy = stubs.http.request = spy(stubs.http.request);
          interceptorSpy = spy(interceptor, 'request');
          client = new HttpResourceClient(stubs.http, [interceptor], []);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);

            const search = requestSpy.args[0][2].params as HttpParams;

            expect(search.get('testy')).to.equal('boomf');
            expect(_res).to.equal(res);
          });
        });
      });

      describe('when using a request error interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;

        class RequestInterceptor
          implements HttpRequestInterceptor, HttpRequestErrorInterceptor {
          request(req: Partial<HttpRequest<any>>): any {
            return Promise.reject(new Error());
          }

          requestError(): any {
            return Promise.resolve({});
          }
        }

        beforeEach(() => {
          const interceptor = new RequestInterceptor();

          requestSpy = stubs.http.request = spy(stubs.http.request);
          interceptorSpy = spy(interceptor, 'requestError');
          client = new HttpResourceClient(stubs.http, [interceptor], []);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
            expect(_res).to.equal(res);
          });
        });
      });

      describe('when using a response interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;
        let data;

        class ResponseInterceptor implements HttpResponseInterceptor {
          response(res: any): any {
            return data;
          }
        }

        beforeEach(() => {
          const interceptor = new ResponseInterceptor();
          data = {};

          requestSpy = stubs.http.request = spy(stubs.http.request);
          interceptorSpy = spy(interceptor, 'response');
          client = new HttpResourceClient(stubs.http, [interceptor], null);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
            expect(interceptorSpy.args[0][0]).to.equal(res);
            expect(_res).to.equal(data);
          });
        });
      });

      describe('when the response interceptor errors', () => {
        let data;
        let interceptor: ResponseInterceptor;

        class ResponseInterceptor implements HttpResponseInterceptor {
          response(res: any): any {
            return Promise.reject(new Error());
          }
        }

        beforeEach(() => {
          interceptor = new ResponseInterceptor();
          client = new HttpResourceClient(stubs.http, [interceptor], null);
        });

        it('should fail the request', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res
            .toPromise()
            .then(() => assert.fail())
            .catch(_res => expect(_res).to.be.an.instanceof(Error));
        });
      });

      describe('when using a response error interceptor and the request fails', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;
        let res, data;
        let interceptor: ResponseInterceptor;

        class ResponseInterceptor implements HttpResponseErrorInterceptor {
          responseError(): any {
            return res;
          }
        }

        beforeEach(() => {
          interceptor = new ResponseInterceptor();
          data = {};
          res = data;

          requestSpy = stubs.http.request = spy(() =>
            Observable.throw(new Error())
          );
          interceptorSpy = spy(interceptor, 'responseError');
          client = new HttpResourceClient(stubs.http, [interceptor], null);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
            expect(interceptorSpy.args[0][0]).to.be.instanceof(Error);
            expect(_res).to.equal(data);
          });
        });

        it('should fail the request', () => {
          const error = new Error();

          interceptor.responseError = () => Promise.reject(error);

          const $res = client[method]({}) as Observable<any>;

          return $res
            .toPromise()
            .then(() => assert.fail())
            .catch(_res => expect(_res).to.equal(error));
        });
      });

      describe('when using a response error interceptor and it fails', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;
        let interceptor: ResponseInterceptor;

        class ResponseInterceptor implements HttpResponseErrorInterceptor {
          responseError(): any {
            return Promise.reject(new Error());
          }
        }

        beforeEach(() => {
          interceptor = new ResponseInterceptor();

          requestSpy = stubs.http.request = spy(() =>
            Observable.throw(new Error())
          );
          client = new HttpResourceClient(stubs.http, [interceptor], null);
        });

        it('should fail the request', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res
            .toPromise()
            .then(() => assert.fail())
            .catch(_res => expect(_res).to.be.an.instanceof(Error));
        });
      });

      describe('when using a response transformer', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;
        let transform: ResponseTransformer;
        let transformed;

        class ResponseTransformer implements HttpResponseTransform<any, any> {
          response(data: any): any {
            return transformed;
          }
        }

        beforeEach(() => {
          transformed = {};
          transform = new ResponseTransformer();

          client = new HttpResourceClient(stubs.http, [], [transform]);
        });

        it('should transform the response', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(_res).to.equal(transformed);
          });
        });
      });
    });
  }
});

