import { ModelNames } from '@common/constants';
import {
  CustomError,
  ErrorType,
  ICustomerModel,
  StripeMetadataEventsEnum,
  StripeService,
} from '@instapets-backend/common';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import Stripe from 'stripe';
import { PaymentMethodIdParamDto } from './dto/payment-method-id-param.dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(ModelNames.CUSTOMER) private customerModel: ICustomerModel,
    private readonly stripeService: StripeService,
  ) {}

  async getPaymentMethods(customerId: string | Types.ObjectId) {
    const customerProfile = await this.customerModel.findById(customerId);

    const paymentMethods = await this.stripeService.client.customers.listPaymentMethods(
      customerProfile.stripeCustomerId,
      {
        limit: 5,
      },
    );

    const customer: Stripe.Response<Stripe.Customer> = (await this.stripeService.client.customers.retrieve(
      customerProfile.stripeCustomerId,
    )) as Stripe.Response<Stripe.Customer>;

    return this.formatPaymentMethods(paymentMethods.data);
  }

  async createVerificationIntent(customerId: string | Types.ObjectId) {
    const customerProfile = await this.customerModel.findById(customerId);

    const paymentMethods = await this.getPaymentMethods(customerId);

    if (paymentMethods.length >= 5) {
      throw new ForbiddenException(
        new CustomError({
          localizedMessage: {
            en: 'Stripe max payment methods allowed exceeded',
            ar: 'تجاوز الحد الأقصى المسموح به من طرق الدفع',
          },
          errorType: ErrorType.FORBIDDEN,
          event: 'STRIPE_MAX_PAYMENT_METHODS_ALLOWED_EXCEEDED',
        }),
      );
    }

    const setupIntent = await this.stripeService.client.setupIntents.create({
      customer: customerProfile.stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
      metadata: {
        event: StripeMetadataEventsEnum.SETUP_INTENT_SUCCEEDED,
        customerId: customerProfile.stripeCustomerId,
      },
    });

    return {
      clientSecret: setupIntent.client_secret,
    };
  }

  async getPaymentMethodById(customerId: string | Types.ObjectId, { paymentMethodId }: PaymentMethodIdParamDto) {
    const customerProfile = await this.customerModel.findById(customerId);

    const paymentMethod = await this.stripeService.client.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || paymentMethod.customer !== customerProfile.stripeCustomerId) {
      throw new NotFoundException(
        new CustomError({
          localizedMessage: {
            en: 'Payment not found',
            ar: 'الدفع غير موجود',
          },
          errorType: ErrorType.NOT_FOUND,
          event: 'PAYMENT_NOT_FOUND',
        }),
      );
    }

    const customer: Stripe.Response<Stripe.Customer> = (await this.stripeService.client.customers.retrieve(
      customerProfile.stripeCustomerId,
    )) as Stripe.Response<Stripe.Customer>;

    return this.formatPaymentMethod(paymentMethod);
  }

  private formatPaymentMethods(paymentMethods: Stripe.PaymentMethod[]) {
    return paymentMethods.map((paymentMethod) => this.formatPaymentMethod(paymentMethod));
  }

  private formatPaymentMethod(paymentMethod: Stripe.PaymentMethod) {
    return {
      _id: paymentMethod?.id,
      type: paymentMethod?.type,
      card: {
        brand: paymentMethod?.card?.brand,
        display_brand: paymentMethod?.card?.brand,
        last4: paymentMethod?.card?.last4,
        expMonth: paymentMethod?.card?.exp_month,
        expYear: paymentMethod?.card?.exp_year,
      },
    };
  }
}
