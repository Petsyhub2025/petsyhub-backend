import {
  EventListenerErrorHandlerService,
  AwsSESService,
  TemplateManagerService,
  ServiceProviderEventsEnum,
  ServiceProvider,
  BaseBranch,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class BranchEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
  ) {}

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_CREATED, { promisify: true })
  async handleBranchCreated(event: {
    serviceProvider: HydratedDocument<ServiceProvider>;
    branch: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_CREATED,
      async () => {
        const { serviceProvider, branch } = event;
        const template = this.templateService.getServiceProviderBranchSubmittedEmail(
          serviceProvider.fullName,
          branch.name,
        );

        await this.sesService.sendEmail({
          emails: serviceProvider.email,
          subject: 'Your New PetsyHub Branch is Pending Review',
          template,
        });
      },
    );
  }

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_APPROVED, { promisify: true })
  async handleBranchApproved(event: {
    serviceProvider: HydratedDocument<ServiceProvider>;
    branch: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_APPROVED,
      async () => {
        const { serviceProvider, branch } = event;
        const template = this.templateService.getServiceProviderShopApprovedEmail(
          serviceProvider.fullName,
          branch.name,
        );

        await this.sesService.sendEmail({
          emails: serviceProvider.email,
          subject: 'Your PetsyHub Branch is Approved',
          template,
        });
      },
    );
  }

  @OnEvent(ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_REJECTED, { promisify: true })
  async handleBranchRejected(event: {
    serviceProvider: HydratedDocument<ServiceProvider>;
    branch: HydratedDocument<BaseBranch>;
    rejectionReason: string;
  }) {
    return this.errorHandler.eventListenerErrorHandler(
      ServiceProviderEventsEnum.SERVICE_PROVIDER_BRANCH_REJECTED,
      async () => {
        const { serviceProvider, branch, rejectionReason } = event;
        const template = this.templateService.getServiceProviderShopRejectedEmail(
          serviceProvider.fullName,
          branch.name,
          rejectionReason,
        );

        await this.sesService.sendEmail({
          emails: serviceProvider.email,
          subject: 'Your PetsyHub Branch is Rejected',
          template,
        });
      },
    );
  }
}
