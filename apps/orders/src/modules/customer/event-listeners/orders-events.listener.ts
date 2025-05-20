import { EventListenerErrorHandlerService } from '@common/modules/common/services/event-listener-handlers';
import { CustomerEventsEnum } from '@common/schemas/mongoose/customer/customer.enum';
import {
  AwsSESService,
  Customer,
  IBaseBranchModel,
  ICustomerAddressModel,
  ICustomerModel,
  IProductModel,
  ModelNames,
  Order,
  ShippingTypeEnum,
  TemplateManagerService,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { HydratedDocument } from 'mongoose';

@Injectable()
export class CustomerOrderEventListener {
  constructor(
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    @Inject(ModelNames.BASE_BRANCH) private branchModel: IBaseBranchModel,
    @Inject(ModelNames.CUSTOMER_ADDRESS) private customerAddressModel: ICustomerAddressModel,
    @Inject(ModelNames.PRODUCT) private readonly productModel: IProductModel,
    private readonly errorHandler: EventListenerErrorHandlerService,
    private readonly sesService: AwsSESService,
    private readonly templateService: TemplateManagerService,
  ) {}
  @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_PAYMENT_SUCCESS, { promisify: true })
  async handleOrderPaymentSuccess(event: HydratedDocument<Order>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_PAYMENT_SUCCESS, async () => {
      const customer = await this.customerModel.findById(event.customer);

      const template = this.templateService.getOrderPaymentSuccessEmail(customer.firstName, event.generatedUniqueId);
      await this.sesService.sendEmail({
        emails: customer.email,
        subject: `Payment Received for Your Order: ${event.generatedUniqueId}`,
        template,
      });
    });
  }

  // @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_PAYMENT_FAILURE, { promisify: true })
  // async handleOrderPaymentFailure(event: CustomerOrderPaymentFailureEvent) {
  //   return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_PAYMENT_FAILURE, async () => {
  //     const content = `
  //       <p>We encountered a problem processing your payment for order #${event.orderId}. ❌</p>
  //       <p>Please try again to complete your purchase.</p>
  //     `;
  //     const html = this.emailService.petsyTemplate(event.customerName, content);
  //     await this.emailService.sendEmail({
  //       emails: event.customerEmail,
  //       subject: 'Payment Issue with Your Order',
  //       template: html,
  //     });
  //   });
  // }

  @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_PLACED, { promisify: true })
  async handleOrderConfirmed(event: { order: HydratedDocument<Order>; customer: HydratedDocument<Customer> }) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_PLACED, async () => {
      const { order, customer } = event;

      const shop = (await this.branchModel
        .findById(order.productsProvidedShop)
        .populate(['area', 'city', 'country'])) as any;
      const shopAddressString = `${shop.streetAddress}`;

      const customerAdressDoc = (await this.customerAddressModel
        .findById(order.deliveredToAddress)
        .populate(['area', 'city', 'country'])) as any;

      const customerAddress = customerAdressDoc.toObject();
      const customerAddressString = `${customerAddress.streetName}, ${customerAddress.area.name.en}, ${customerAddress.city.name.en}, ${customerAddress.country.name.en}`;

      const orderedProducts = await Promise.all(
        order.orderedProducts.map(async (product) => {
          return {
            name: (await this.productModel.findById(product.productId)).name.en,
            quantity: product.quantity,
            price: product.orderedPrice,
            total: product.orderedPrice * product.quantity,
            sku: (await this.productModel.findById(product.productId)).sku,
          };
        }),
      );

      if (order.shippingType === ShippingTypeEnum.FREE) {
        order.shippingFee = 0;
      }

      const template = this.templateService.getOrderInvoiceEmail(
        customer,
        order,
        shop,
        orderedProducts,
        customerAddressString,
        shopAddressString,
      );

      const orderStatus = order.status.toString().toLowerCase() || 'Placed';
      await this.sesService.sendEmail({
        emails: customer.email,
        subject: `Your PetsyHub Order has been ${orderStatus}!`,
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_PROCESSING, { promisify: true })
  async handleOrderProcessing(event: HydratedDocument<Order>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_PROCESSING, async () => {
      const customer = await this.customerModel.findById(event.customer);
      const template = this.templateService.getOrderProcessingEmail(customer.firstName, event.generatedUniqueId);

      await this.sesService.sendEmail({
        emails: customer.email,
        subject: 'Your PetsyHub Order is Being Processed!',
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_OUT_FOR_DELIVERY, { promisify: true })
  async handleOrderOutForDelivery(event: HydratedDocument<Order>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_OUT_FOR_DELIVERY, async () => {
      const customer = await this.customerModel.findById(event.customer);
      const template = this.templateService.getOrderOutForDeliveryEmail(customer.firstName, event.generatedUniqueId);

      await this.sesService.sendEmail({
        emails: customer.email,
        subject: 'Your PetsyHub Order is Out for Delivery!',
        template,
      });
    });
  }

  @OnEvent(CustomerEventsEnum.CUSTOMER_ORDER_DELIVERED, { promisify: true })
  async handleOrderDelivered(event: HydratedDocument<Order>) {
    return this.errorHandler.eventListenerErrorHandler(CustomerEventsEnum.CUSTOMER_ORDER_DELIVERED, async () => {
      const customer = await this.customerModel.findById(event.customer);
      const template = this.templateService.getOrderDeliveredEmail(customer.firstName, event.generatedUniqueId);

      await this.sesService.sendEmail({
        emails: customer.email,
        subject: 'Your PetsyHub Order Has Been Delivered!',
        template,
      });
    });
  }
}
