import { Module } from '@nestjs/common';
import { SharedModule } from '@products/shared/shared.module';
import { ProductSubCategoriesController } from './controllers/product-subcategories/product-subcategories.controller';
import { ProductSubCategoriesService } from './controllers/product-subcategories/product-subcategories.service';
import { ProductCategoriesService } from './controllers/product-categories/product-categories.service';
import { ProductCategoriesController } from './controllers/product-categories/product-categories.controller';
import { ProductsService } from './controllers/products/products.service';
import { ProductsController } from './controllers/products/products.controller';
import { InventoryMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [SharedModule, InventoryMongooseModule],
  controllers: [ProductSubCategoriesController, ProductCategoriesController, ProductsController],
  providers: [ProductSubCategoriesService, ProductCategoriesService, ProductsService],
})
export class CustomerModule {}
