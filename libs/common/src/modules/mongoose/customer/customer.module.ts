import { ModelNames } from '@common/constants';
import { customerSchemaFactory } from '@common/schemas/mongoose/customer/customer.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { MongooseCommonModule } from '@common/modules/mongoose/common';

const CustomerMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CUSTOMER,
  inject: [getConnectionToken()],
  useFactory: customerSchemaFactory,
};

const customerProviders = [CustomerMongooseDynamicModule];

@Module({
  imports: [MongooseCommonModule.forRoot()],
  providers: customerProviders,
  exports: customerProviders,
})
export class CustomerMongooseModule {}
