import { 
  RequestMethod,
  ResourceFetchClient, 
  ResourceRequest, 
  ResponseContentType
} from 'resticle';

export class FetchResourceClient implements ResourceFetchClient {
  get<T>(req: ResourceRequest<T>): Promise<T> {
    return this.request(req);
  }
  
  put<T>(req: ResourceRequest<T>): Promise<T> {
    return this.request(req);
  }

  delete<T>(req: ResourceRequest<T>): Promise<T> {
    return this.request(req);
  }

  post<T>(req: ResourceRequest<T>): Promise<T> {
    return this.request(req);
  }

  subscribe<T>(res: Promise<T>, callback: (val: any) => T): Promise<T> {
    return res.then(val => callback(val));
  }

  protected request<T>(req: ResourceRequest<T>): Promise<T> {
    return fetch(req.path, this.convertRequest(req))
      .then(res => <Promise<T>>this.extract(res, req));
  }

  private convertRequest<T>(req: ResourceRequest<T>): RequestInit {
    return {
      method: this.convertMethod(req.method),
      body: JSON.stringify(req.body),
      credentials: req.withCredentials ? 'include' : 'omit',
      headers: new Headers(req.headers || {})
    };
  }

  private convertMethod(method: RequestMethod): string {
    switch (method) {
      case RequestMethod.DELETE: return 'DELETE';
      case RequestMethod.PUT: return 'PUT';
      case RequestMethod.POST: return 'POST';
      case RequestMethod.GET:
      default: 
        return 'GET';
    }
  }

  private extract(res: Response, req: ResourceRequest<any>): Promise<any> {
    switch (req.responseType) {
      case ResponseContentType.JSON: return res.json();
      case ResponseContentType.ARRAY_BUFFER: return res.arrayBuffer();
      case ResponseContentType.BLOB: return res.blob();
    }  
  }
}