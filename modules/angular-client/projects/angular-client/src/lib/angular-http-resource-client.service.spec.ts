import { TestBed } from '@angular/core/testing';
import { expect, assert } from 'chai';
import { spy } from 'sinon';
import { Observable, of, throwError } from 'rxjs';
import { ResponseContentType, RequestMethod } from 'resticle';
import { HttpParams, HttpRequest, HttpClient } from '@angular/common/http';

import {
  HttpRequestInterceptor,
  HttpRequestErrorInterceptor,
  HttpResponseInterceptor,
  HttpResponseErrorInterceptor,
  HttpResponseTransform,
  HTTP_TRANSFORMS,
  HTTP_INTERCEPTORS,
  HttpInterceptor,
  HttpTransform
} from './common';
import { AngularHttpResourceClient } from './angular-http-resource-client.service';

describe('AngularHttpResourceClient', () => {
  let res;
  let client: AngularHttpResourceClient;
  let interceptors: HttpInterceptor[];
  let transforms: HttpTransform[];
  let http: any;

  beforeEach(() => {
    res = {};
    http = {
      request: () => of(res)
    };
    interceptors = [];
    transforms = [];

    TestBed.configureTestingModule({
      providers: [
        AngularHttpResourceClient,
        { provide: HttpClient, useFactory: () => http },
        { provide: HTTP_INTERCEPTORS, useFactory: () => interceptors },
        { provide: HTTP_TRANSFORMS, useFactory: () => transforms }
      ]
    });
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
            },
            responseType: ResponseContentType.BLOB
          };

          requestSpy = http.request = spy(http.request);
          client = TestBed.inject(AngularHttpResourceClient);
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
            expect(reqArg.responseType).to.equal('blob')
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

          requestSpy = http.request = spy(http.request);
          interceptorSpy = spy(interceptor, 'request');
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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

          requestSpy = http.request = spy(http.request);
          interceptorSpy = spy(interceptor, 'requestError');
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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

          requestSpy = http.request = spy(http.request);
          interceptorSpy = spy(interceptor, 'response');
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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

          requestSpy = http.request = spy(() =>
            throwError(new Error())
          );
          interceptorSpy = spy(interceptor, 'responseError');
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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

          requestSpy = http.request = spy(() =>
            throwError(new Error())
          );
          interceptors = [interceptor];
          client = TestBed.inject(AngularHttpResourceClient);
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
          transforms = [transform];
          client = TestBed.inject(AngularHttpResourceClient);
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

