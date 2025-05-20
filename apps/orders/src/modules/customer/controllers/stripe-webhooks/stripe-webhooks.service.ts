import {
  AppConfig,
  CustomerEventsEnum,
  CustomLoggerService,
  IBaseBranchModel,
  IBranchAccessControlModel,
  ICustomerModel,
  IInventoryModel,
  IOrderModel,
  IServiceProviderModel,
  ModelNames,
  PaymentStatusEnum,
  ServiceProviderEventsEnum,
  StripeService,
} from '@instapets-backend/common';
import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Types } from 'mongoose';
@Injectable()
export class StripeWebhooksService {
  constructor(
    @Inject(ModelNames.ORDER) private orderModel: IOrderModel,
    @Inject(ModelNames.INVENTORY) private inventoryModel: IInventoryModel,
    @Inject(ModelNames.BASE_BRANCH) private branchModel: IBaseBranchModel,
    @Inject(ModelNames.BRANCH_ACCESS_CONTROL) private branchAccessControlModel: IBranchAccessControlModel,
    @Inject(ModelNames.SERVICE_PROVIDER) private readonly serviceProviderModel: IServiceProviderModel,
    private readonly stripeService: StripeService,
    private logger: CustomLoggerService,
    private appConfig: AppConfig,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async handleStripeWebhook(rawBody: Buffer | string, stripeSignature: string) {
    const event = await this.stripeService.verifyWebhookSignatureAndGetEvent(rawBody, stripeSignature);

    // Handle the event
    // eslint-disable-next-line no-console
    console.log(`event type ${event.type}`);

    if (event.type === 'charge.succeeded') {
      const metaData = event?.data?.object?.metadata;

      await this.handlePaymentSucceeded(metaData);
    }
  }

  private async handlePaymentSucceeded(metaData: any) {
    const order = await this.orderModel.findById(metaData.orderId);

    await this.orderModel.updateOne(
      { _id: new Types.ObjectId(metaData.orderId) },
      {
        $set: {
          paymentStatus: PaymentStatusEnum.PAID,
        },
      },
    );

    order.orderedProducts.forEach(async (item) => {
      const productId = item.productId;
      const orderedQuantity = item.quantity;

      const inventory = await this.inventoryModel.findOne({
        'product.productId': productId,
        branch: order.productsProvidedShop,
      });
      inventory.product.quantityInStock -= orderedQuantity;
      inventory.product.totalOrders += 1;

      await inventory.save();
    });

    const branchAccessControl = await this.branchAccessControlModel.findOne({ branch: order.productsProvidedShop });
    const serviceProvider = await this.serviceProviderModel.findById(branchAccessControl.serviceProvider);
    const shop = await this.branchModel.findById(order.productsProvidedShop);

    this.eventEmitter.emit(CustomerEventsEnum.CUSTOMER_ORDER_PAYMENT_SUCCESS, { order });
    this.eventEmitter.emit(ServiceProviderEventsEnum.ORDER_PAYMENT_SUCCESS, {
      order,
      serviceProvider,
      shop,
    });
  }
}
