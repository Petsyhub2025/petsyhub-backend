import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import { AWS_SCHEDULER_CLIENT, AWS_SCHEDULER_MODULE_OPTIONS } from '@common/modules/aws-scheduler/constants';
import { SchedulerClient } from '@aws-sdk/client-scheduler';
import { AwsSchedulerModuleAsyncOptions, AwsSchedulerModuleOptions } from '@common/modules/aws-scheduler/interfaces';

export const createAwsSchedulerAsyncOptionProviders = (options: AwsSchedulerModuleAsyncOptions): FactoryProvider => {
  return {
    provide: AWS_SCHEDULER_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const awsSchedulerDriverProvider: FactoryProvider<SchedulerClient> = {
  provide: AWS_SCHEDULER_CLIENT,
  useFactory: (options: AwsSchedulerModuleOptions) => {
    const logger = new Logger('AwsSchedulerModule');

    const client = new SchedulerClient({
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
      region: options.region,
    });

    logger.log('Scheduler client created');

    return client;
  },
  inject: [AWS_SCHEDULER_MODULE_OPTIONS],
};
