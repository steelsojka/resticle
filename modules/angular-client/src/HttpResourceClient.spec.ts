import { expect, assert } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rxjs/Rx';
import { ResponseContentType, RequestMethod } from 'resticle';
import { 
  ResponseContentType as HttpResponseContentType, 
  URLSearchParams, 
  RequestMethod as HttpRequestMethod, 
  RequestOptionsArgs 
} from '@angular/http';

import { HttpResourceClient } from './HttpResourceClient';
import {
  HttpRequestInterceptor, 
  HttpRequestErrorInterceptor,
  HttpResponseInterceptor,
  HttpResponseErrorInterceptor
} from './common';

describe('HttpResourceClient', () => {
  let stubs, res, resData;
  let client: HttpResourceClient;

  beforeEach(() => {
    res = {
      json: () => resData
    };
    
    resData = {};
    stubs = {
      http: {
        request: () => Observable.of(res)
      },
      ngZone: {
        run: spy(fn => fn())
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
            },
            responseType: ResponseContentType.BLOB
          };
          
          requestSpy = stubs.http.request = spy(stubs.http.request);
          client = new HttpResourceClient(stubs.http, stubs.ngZone, [], []);  
        });

        it('should return the result', () => {
          const $res = client[method](req) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(_res).to.equal(resData);
          });
        });

        it('should make the request', () => {
          const $res = client[method](req) as Observable<any>;

          return $res.toPromise().then(() => {
            const reqArg = requestSpy.args[0][1] as RequestOptionsArgs;
            expect(requestSpy.called).to.be.true;
            expect(requestSpy.args[0][0]).to.equal('http://test.com');
            expect(reqArg).to.be.an('object');
            expect(reqArg.url).to.equal('http://test.com');
            expect(reqArg.withCredentials).to.be.true;
            expect(reqArg.method).to.equal(HttpRequestMethod.Get);
            expect(reqArg.body).to.equal(req.body);
            expect(reqArg.headers.get('test')).to.equal('blorg');
            expect((<URLSearchParams>reqArg.search).get('bam')).to.equal('boom');
            expect(reqArg.responseType).to.equal(HttpResponseContentType.Blob);
          });
        });
      });

      describe('when using a request interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;

        class RequestInterceptor implements HttpRequestInterceptor {
          request(req: RequestOptionsArgs): any {
            const search = req.search as URLSearchParams;

            search.set('testy', 'boomf');

            return Promise.resolve(req);
          }
        }

        beforeEach(() => {
          const interceptor = new RequestInterceptor();
          
          requestSpy = stubs.http.request = spy(stubs.http.request);
          interceptorSpy = spy(interceptor, 'request');
          client = new HttpResourceClient(stubs.http, stubs.ngZone, [ interceptor ], []);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
          
            const search = requestSpy.args[0][1].search as URLSearchParams;
            
            expect(search.get('testy')).to.equal('boomf');
            expect(_res).to.equal(resData);
          });
        });
      });
      
      describe('when using a request error interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;

        class RequestInterceptor implements HttpRequestInterceptor, HttpRequestErrorInterceptor {
          request(req: RequestOptionsArgs): any {
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
          client = new HttpResourceClient(stubs.http, stubs.ngZone, [ interceptor ], []);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
            expect(_res).to.equal(resData);
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
          client = new HttpResourceClient(stubs.http, stubs.ngZone, [], [ interceptor ]);
        });

        it('should invoke the interceptor', () => {
          const $res = client[method]({}) as Observable<any>;

          return $res.toPromise().then(_res => {
            expect(interceptorSpy.callCount).to.equal(1);
            expect(interceptorSpy.args[0][0]).to.equal(resData);
            expect(interceptorSpy.args[0][1]).to.be.an('object');
            expect(_res).to.equal(data);
          });
        });
      });
      
      describe('when using a response error interceptor', () => {
        let interceptorSpy: sinon.SinonSpy;
        let requestSpy: sinon.SinonSpy;
        let data;
        let interceptor: ResponseInterceptor;

        class ResponseInterceptor implements HttpResponseInterceptor, HttpResponseErrorInterceptor {
          response(res: any): any {
            return Promise.reject(new Error());    
          }

          responseError(): any {
            return data;  
          }
        }

        beforeEach(() => {
          interceptor = new ResponseInterceptor();
          data = {};
          
          requestSpy = stubs.http.request = spy(stubs.http.request);
          interceptorSpy = spy(interceptor, 'responseError');
          client = new HttpResourceClient(stubs.http, stubs.ngZone, [], [ interceptor ]);
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

          return $res.toPromise()
            .then(() => assert.fail())
            .catch(_res => expect(_res).to.equal(error));
        });
      });
    });
  }
});