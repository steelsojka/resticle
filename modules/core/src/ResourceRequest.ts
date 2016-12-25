export class ResourceRequest<T> {
  url: string;
  params: { [key: string]: any };
  payload: T|null;
}