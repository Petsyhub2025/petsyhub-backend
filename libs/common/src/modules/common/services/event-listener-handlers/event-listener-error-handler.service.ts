import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '../logger';

@Injectable()
export class EventListenerErrorHandlerService {
  constructor(private readonly logger: CustomLoggerService) {}

  async eventListenerErrorHandler(eventName: string, fn: (...args: any[]) => Promise<any> | any) {
    try {
      await fn();
    } catch (error) {
      this.logger.error(`Error in event listener for event ${eventName}  ${error?.message}`, { error });
    }
  }
}
