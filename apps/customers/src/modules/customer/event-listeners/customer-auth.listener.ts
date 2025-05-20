import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { Customer } from '@common/schemas/mongoose/customer/customer.type';
import { CustomerEventsEnum } from '@common/schemas/mongoose/customer/customer.enum';
import { AwsSESService, TemplateManagerService } from '@instapets-backend/common';

@Injectable()
export class CustomerAuthEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
  ) {}

  @OnEvent(CustomerEventsEnum.CUSTOMER_REGISTERED, { promisify: true })
  async handleCustomerRegistered(event: HydratedDocument<Customer>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_REGISTERED, async () => {
      const template = this.templateService.getCustomerWelcomeEmail(event.firstName);

      await this.sesService.sendEmail({
        emails: event.email,
        subject: 'Welcome to PetsyHub!',
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_LOGIN_SUCCESS, { promisify: true })
  async handleLoginSuccess(event: HydratedDocument<Customer>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_LOGIN_SUCCESS, async () => {
      const template = this.templateService.getLoginSuccessEmail(event.firstName);

      await this.sesService.sendEmail({
        emails: event.email,
        subject: 'Successful Login to Your PetsyHub Account',
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_LOGIN_FAILURE, { promisify: true })
  async handleLoginFailure(event: HydratedDocument<Customer>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_LOGIN_FAILURE, async () => {
      const template = this.templateService.getLoginFailureEmail(event.firstName);

      await this.sesService.sendEmail({
        emails: event.email,
        subject: 'Unsuccessful Login Attempt to Your PetsyHub Account',
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_PASSWORD_CHANGED, { promisify: true })
  async handlePasswordChanged(event: HydratedDocument<Customer>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_PASSWORD_CHANGED, async () => {
      const template = this.templateService.getPasswordChangedEmail(event.firstName);

      await this.sesService.sendEmail({
        emails: event.email,
        subject: 'Your PetsyHub Account Password Has Been Changed',
        template,
      });
    });
  }
}
