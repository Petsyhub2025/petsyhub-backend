import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import {
  AwsSESService,
  BaseBranch,
  Order,
  ServiceProvider,
  ServiceProviderEventsEnum,
  TemplateManagerService,
} from '@instapets-backend/common';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class OrderEventListener {
  constructor(
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
  ) {}

  @OnEvent(ServiceProviderEventsEnum.ORDER_PLACED, { promisify: true })
  async handleNewOrderReceieved(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_PLACED, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderPlacedEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: New Order Received!(${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_PAYMENT_SUCCESS, { promisify: true })
  async handleOrderPaymentSuccess(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_PAYMENT_SUCCESS, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderPaymentSuccessEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Payment Received for Order #${order.generatedUniqueId} (${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_SCHEDULED, { promisify: true })
  async handleOrderScheduled(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_SCHEDULED, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderScheduledEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Order Scheduled!(${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_PROCESSING, { promisify: true })
  async handleOrderProcessing(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_PROCESSING, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderProcessingEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Order Processing!(${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_OUT_FOR_DELIVERY, { promisify: true })
  async handleOrderOutForDelivery(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_OUT_FOR_DELIVERY, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderOutForDeliveryEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Order Out for Delivery!(${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_DELIVERED, { promisify: true })
  async handleOrderDelivered(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_DELIVERED, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderDeliveredEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Order Delivered!(${shop.name})`,
        template,
      });
    });
  }

  @OnEvent(ServiceProviderEventsEnum.ORDER_COMPLETED, { promisify: true })
  async handleOrderCompleted(event: {
    order: HydratedDocument<Order>;
    serviceProvider: HydratedDocument<ServiceProvider>;
    shop: HydratedDocument<BaseBranch>;
  }) {
    return this.errorHandler.eventListenerErrorHandler(ServiceProviderEventsEnum.ORDER_COMPLETED, async () => {
      const { order, serviceProvider, shop } = event;
      const template = this.templateService.getServiceProviderOrderDeliveredEmail(
        serviceProvider.fullName,
        order.generatedUniqueId,
        shop.name,
      );
      await this.sesService.sendEmail({
        emails: serviceProvider.email,
        subject: `PetsyHub: Order Completed!(${shop.name})`,
        template,
      });
    });
  }
}
