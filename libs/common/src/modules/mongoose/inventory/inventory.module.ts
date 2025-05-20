import { ModelNames } from '@common/constants';
import { inventorySchemaFactory } from '@common/schemas/mongoose/inventory/inventory.schema';
import { FactoryProvider, Module } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';

const InventoryMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.INVENTORY,
  inject: [getConnectionToken()],
  useFactory: inventorySchemaFactory,
};

const inventoryProviders = [InventoryMongooseDynamicModule];

@Module({
  imports: [],
  providers: inventoryProviders,
  exports: inventoryProviders,
})
export class InventoryMongooseModule {}
