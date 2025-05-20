import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';
import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { ServiceProviderEventsEnum } from '@common/schemas/mongoose/serviceprovider/serviceprovider.enum';
import { AwsSESService, TemplateManagerService } from '@instapets-backend/common';
import { ServiceProvider } from 'libs/common/src/schemas/mongoose/serviceprovider/serviceprovider.type';

@Injectable()
export class ServiceProviderAuthEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
  ) {}

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_REGISTERED, { promisify: true })
  async handleServiceProviderRegistered(event: HydratedDocument<ServiceProvider>) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_REGISTERED,
      async () => {
        const template = this.templateService.getServiceProviderWelcomeEmail(event.fullName);

        await this.sesService.sendEmail({
          emails: event.email,
          subject: 'Welcome to PetsyHub!',
          template,
        });
      },
    );
  }

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_SUCCESS, { promisify: true })
  async handleLoginSuccess(event: HydratedDocument<ServiceProvider>) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_SUCCESS,
      async () => {
        const template = this.templateService.getLoginSuccessEmail(event.fullName);

        await this.sesService.sendEmail({
          emails: event.email,
          subject: 'Successful Login to Your PetsyHub Account',
          template,
        });
      },
    );
  }

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_FAILURE, { promisify: true })
  async handleLoginFailure(event: HydratedDocument<ServiceProvider>) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_LOGIN_FAILURE,
      async () => {
        const template = this.templateService.getLoginFailureEmail(event.fullName);

        await this.sesService.sendEmail({
          emails: event.email,
          subject: 'Unsuccessful Login Attempt to Your PetsyHub Account',
          template,
        });
      },
    );
  }

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_PASSWORD_CHANGED, { promisify: true })
  async handlePasswordChanged(event: HydratedDocument<ServiceProvider>) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_PASSWORD_CHANGED,
      async () => {
        const template = this.templateService.getPasswordChangedEmail(event.fullName);

        await this.sesService.sendEmail({
          emails: event.email,
          subject: 'Your PetsyHub Account Password Has Been Changed',
          template,
        });
      },
    );
  }
}
