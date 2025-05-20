import { ModelNames } from '@common/constants';
import { countrySchemaFactory } from '@common/schemas/mongoose/country/country.schema';
import { CountryHelperService } from '@common/schemas/mongoose/country/services';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const CountryMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.COUNTRY,
  inject: [getConnectionToken(), CountryHelperService],
  useFactory: countrySchemaFactory,
};

const countryProviders = [CountryMongooseDynamicModule, CountryHelperService];

@Module({
  imports: [],
  providers: countryProviders,
  exports: countryProviders,
})
export class CountryMongooseModule {}
