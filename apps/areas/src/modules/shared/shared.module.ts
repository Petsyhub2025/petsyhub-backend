import { Module } from '@nestjs/common';
import {
  AreaMongooseModule,
  CityMongooseModule,
  CountryMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

const imports = [CityMongooseModule, CountryMongooseModule, AreaMongooseModule, UserMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
