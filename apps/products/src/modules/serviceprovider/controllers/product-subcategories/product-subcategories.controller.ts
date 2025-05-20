import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BranchAccessResourceOperationsEnum,
  BranchAccessResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
} from '@instapets-backend/common';
import { ProductSubCategoriesService } from './product-subcategories.service';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Controller({ path: 'product-sub-categories', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider/product-sub-categories')
export class ProductSubCategoriesController {
  constructor(private readonly productSubCategoriesService: ProductSubCategoriesService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.PRODUCT_CATEGORIES,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getProductSubCategories(
    @Persona() serviceProviderJwtPersona: ServiceProviderJwtPersona,
    @Query() query: GetSubCategoriesQueryDto,
  ) {
    const productSubCategories = await this.productSubCategoriesService.getProductSubCategories(
      serviceProviderJwtPersona._id,
      query,
    );
    return new CustomResponse().success({
      payload: productSubCategories,
    });
  }
}
