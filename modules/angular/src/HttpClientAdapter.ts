import { Injectable, Inject } from '@angular/core';
import { 
  RequestMethod, 
  RequestOptionsArgs, 
  ResponseContentType, 
  Response, 
  Http, 
  Headers, 
  URLSearchParams 
} from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';
import { 
  RequestMethod as ResticleRequestMethod,
  ResourceFetchClient, 
  ResourceRequest, 
  ResponseContentType as ResticleResponseContentType 
} from '@resticle/core';

@Injectable()
export class HttpFetchClient implements ResourceFetchClient {
  constructor(
    @Inject(Http) private http: Http
  ) {}
  
  get<T>(req: ResourceRequest<T>): Observable<T> {
    return this.http.get(req.path, this.convertRequest(req))
      .map(res => this.extract<T>(res));  
  }
  
  put<T>(req: ResourceRequest<T>): Observable<T> {
    return this.http.put(req.path, this.convertRequest(req))
      .map(res => this.extract<T>(res));  
  }

  delete<T>(req: ResourceRequest<T>): Observable<T> {
    return this.http.delete(req.path, this.convertRequest(req))
      .map(res => this.extract<T>(res));  
  }

  post<T>(req: ResourceRequest<T>): Observable<T> {
    return this.http.delete(req.path, this.convertRequest(req))
      .map(res => this.extract<T>(res));  
  }

  serializeQuery(): string {
    return ''; // Allow Angular to serialize the query.
  }

  private convertRequest<T>(req: ResourceRequest<T>): RequestOptionsArgs {
    return {
      withCredentials: Boolean(req.withCredentials),
      body: req.body,
      headers: new Headers(req.headers || {}),
      search: this.convertParams(req.search),
      responseType: this.convertResponseType(req.responseType)
    };
  }

  private convertResponseType(type?: ResticleResponseContentType): ResponseContentType {
    switch (type) {
      case ResticleResponseContentType.BLOB: return ResponseContentType.Blob;
      case ResticleResponseContentType.ARRAY_BUFFER: return ResponseContentType.ArrayBuffer;
      case ResticleResponseContentType.TEXT: return ResponseContentType.Text;
      case ResticleResponseContentType.JSON:
      default: 
        return ResponseContentType.Json;
    }
  }

  private convertParams(search: {[key: string]: any}): URLSearchParams {
    return Object.keys(search).reduce((params, key) => {
      params.set(key, search[key]);

      return params;
    }, new URLSearchParams());
  }

  private extract<T>(res: Response): T {
    return res.json();  
  }
}