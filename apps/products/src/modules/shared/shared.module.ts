import { Module } from '@nestjs/common';
import {
  BranchMongooseModule,
  ProductCategoryMongooseModule,
  ProductMongooseModule,
  ProductSubCategoryMongooseModule,
} from '@instapets-backend/common';

const imports = [
  ProductCategoryMongooseModule,
  ProductSubCategoryMongooseModule,
  ProductMongooseModule,
  BranchMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
