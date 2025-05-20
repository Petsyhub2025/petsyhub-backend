import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import {
  BranchAccessResourceOperationsEnum,
  BranchAccessResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
  ServiceProviderPermission,
  ServiceProviderJwtPersona,
} from '@instapets-backend/common';
import { GetProductCategoriesQueryDto } from './dtos/get-products-categories.dto';

@Controller({ path: 'product-categories', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider/product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.PRODUCT_CATEGORIES,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getProductCategories(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Query() query: GetProductCategoriesQueryDto,
  ) {
    const productCategories = await this.productCategoriesService.getProductCategories(
      serviceProviderJwtPersona._id,
      query,
    );
    return new CustomResponse().success({
      payload: productCategories,
    });
  }
}
