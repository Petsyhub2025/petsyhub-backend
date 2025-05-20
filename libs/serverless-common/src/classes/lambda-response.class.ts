interface IBaseLambdaResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: any;
  message?: string;
}

interface ISuccessLambdaResponse<T = any> extends IBaseLambdaResponse<T> {
  status: 'success';
  data: T;
  error?: never;
}

interface IErrorLambdaResponse extends IBaseLambdaResponse {
  status: 'error';
  message: string;
  error?: any;
  data?: never;
}

type _LambdaResponse = ISuccessLambdaResponse | IErrorLambdaResponse;

export class LambdaResponse<T = any> implements IBaseLambdaResponse<T> {
  public status: 'success' | 'error';
  public data?: T;
  public error?: any;
  public message?: string;

  private constructor() {}

  public static success(data: Record<string, any>): _LambdaResponse {
    return {
      status: 'success',
      data,
    };
  }

  public static error(message: string, error: any): _LambdaResponse {
    return {
      status: 'error',
      message,
      error,
    };
  }
}
