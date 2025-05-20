import { FactoryProvider, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { StripeModuleAsyncOptions, StripeModuleOptions } from '@common/modules/stripe/interfaces';
import { STRIPE_CLIENT, STRIPE_MODULE_OPTIONS } from '@common/modules/stripe/constants';

export const createStripeAsyncOptionProviders = (options: StripeModuleAsyncOptions): FactoryProvider => {
  return {
    provide: STRIPE_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const stripeDriverProvider: FactoryProvider<Stripe> = {
  provide: STRIPE_CLIENT,
  useFactory: (options: StripeModuleOptions) => {
    const logger = new Logger('StripeModule');

    const client = new Stripe(options.secretKey);

    logger.log('Stripe client created');

    return client;
  },
  inject: [STRIPE_MODULE_OPTIONS],
};
