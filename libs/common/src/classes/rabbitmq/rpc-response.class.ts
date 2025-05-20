import { IRpcError, RpcError } from './rpc-error.class';

export class RpcResponse<T = undefined> {
  private constructor(public success: boolean, public readonly data?: T, public readonly error?: RpcError) {}

  static success<T>(data?: T): RpcResponse<T> {
    return new RpcResponse<T>(true, data);
  }

  static error(error: IRpcError): RpcResponse<undefined> {
    return new RpcResponse<undefined>(false, undefined, new RpcError(error));
  }
}
