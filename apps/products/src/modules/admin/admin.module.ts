import { Module } from '@nestjs/common';
import { SharedModule } from '@products/shared/shared.module';
import { ProductCategoriesService } from './controllers/product-categories/product-categories.service';
import { ProductCategoriesController } from './controllers/product-categories/product-categories.controller';
import { AppConfig, AwsS3Module } from '@instapets-backend/common';
import { ProductSubCategoriesService } from './controllers/product-subcategories/product-subcategories.service';
import { ProductSubCategoriesController } from './controllers/product-subcategories/product-subcategories.controller';
import { ProductsService } from './controllers/products/products.service';
import { ProductsController } from './controllers/products/products.controller';

@Module({
  imports: [
    AwsS3Module.registerAsync({
      useFactory: (appConfig: AppConfig) => ({
        accessKeyId: appConfig.AWS_UPLOAD_ACCESS_KEY_ID,
        secretAccessKey: appConfig.AWS_UPLOAD_SECRET_ACCESS_KEY,
        region: appConfig.AWS_UPLOAD_REGION,
      }),
      inject: [AppConfig],
    }),
    SharedModule,
  ],
  controllers: [ProductCategoriesController, ProductSubCategoriesController, ProductsController],
  providers: [ProductCategoriesService, ProductSubCategoriesService, ProductsService],
})
export class AdminModule {}
