import { ModelNames } from '@common/constants';
import { citySchemaFactory } from '@common/schemas/mongoose/city/city.schema';
import { CityHelperService } from '@common/schemas/mongoose/city/services';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const CityMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.CITY,
  inject: [getConnectionToken(), CityHelperService],
  useFactory: citySchemaFactory,
};

const cityProviders = [CityMongooseDynamicModule, CityHelperService];

@Module({
  imports: [],
  providers: cityProviders,
  exports: cityProviders,
})
export class CityMongooseModule {}
