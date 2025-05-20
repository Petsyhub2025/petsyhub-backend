import { Module } from '@nestjs/common';
import { InventoryMongooseModule, ProductMongooseModule } from '@instapets-backend/common';

const imports = [InventoryMongooseModule, ProductMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
