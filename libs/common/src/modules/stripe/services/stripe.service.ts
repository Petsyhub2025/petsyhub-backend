import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from '@common/modules/stripe/constants';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { CustomLoggerService } from '@common/modules/common/services/logger';

@Injectable()
export class StripeService {
  constructor(
    @Inject(STRIPE_CLIENT) private stripeClient: Stripe,
    private appConfig: AppConfig,
    private logger: CustomLoggerService,
  ) {}

  get client(): Stripe {
    return this.stripeClient;
  }

  async getPaymentMethodAndCheckValidity(paymentMethodId: string, customerId: string, orderDate?: Date) {
    const paymentMethod = await this.stripeClient.paymentMethods.retrieve(paymentMethodId);

    if (!paymentMethod || paymentMethod.customer !== customerId) {
      throw new Error('Payment method not found');
    }

    if (orderDate && paymentMethod.card) {
      const cardExpiry = new Date(paymentMethod.card.exp_year, paymentMethod.card.exp_month - 1);
      if (orderDate > cardExpiry) {
        throw new Error('Payment does not satisfy the expiry date');
      }
    }
    return paymentMethod;
  }

  async verifyWebhookSignatureAndGetEvent(payload: string | Buffer, signature: string) {
    // eslint-disable-next-line no-console
    console.log(payload);
    // eslint-disable-next-line no-console
    console.log(signature);

    try {
      const event = this.stripeClient.webhooks.constructEvent(
        payload,
        signature,
        'whsec_DhC7W21n4dSOaD7TFp9YwB5ApUbxKh10',
      );
      return event;
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err.message}`);
    }
  }
}
