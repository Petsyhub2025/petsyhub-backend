export interface ResponsePayload<T> {
  data?: T[] | T;
  pages?: number;
  page?: number;
  limit?: number;
  total?: number;
}

export class CustomResponse<T = any> {
  payload?: ResponsePayload<T>;
  localizedMessage: { en: string; ar: string };
  statusCode: number;
  event: string;

  success({
    localizedMessage = { en: 'Successful Operation', ar: 'عملية ناجحة' },
    payload,
    statusCode = 200,
    event,
  }: {
    localizedMessage?: { en: string; ar: string };
    payload?: ResponsePayload<T>;
    statusCode?: number;
    event?: string;
  }) {
    this.payload = payload;
    this.localizedMessage = localizedMessage;
    this.statusCode = statusCode;
    this.event = event;

    return this;
  }
}
