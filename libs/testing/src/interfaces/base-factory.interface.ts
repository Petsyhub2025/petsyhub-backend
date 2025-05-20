export interface IBaseFactory<T> {
  create(): Promise<{ mock: T | Partial<T>; result: T }>;
}
