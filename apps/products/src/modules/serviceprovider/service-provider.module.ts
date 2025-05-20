import { Module } from '@nestjs/common';
import { SharedModule } from '@products/shared/shared.module';
import { ProductCategoriesService } from './controllers/product-categories/product-categories.service';
import { ProductCategoriesController } from './controllers/product-categories/product-categories.controller';
import { ProductSubCategoriesService } from './controllers/product-subcategories/product-subcategories.service';
import { ProductsService } from './controllers/products/products.service';
import { ProductSubCategoriesController } from './controllers/product-subcategories/product-subcategories.controller';
import { ProductsController } from './controllers/products/products.controller';

@Module({
  imports: [SharedModule],
  controllers: [ProductCategoriesController, ProductSubCategoriesController, ProductsController],
  providers: [ProductCategoriesService, ProductSubCategoriesService, ProductsService],
})
export class ServiceProviderModule {}
