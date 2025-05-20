import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BasePaginationQuery,
  CustomResponse,
  IsPrivateAuthOrPublic,
  Persona,
  CustomerJwtPersona,
} from '@instapets-backend/common';
import { ProductSubCategoriesService } from './product-subcategories.service';
import { globalControllerVersioning } from '@products/shared/constants';
import { GetSubCategoriesQueryDto } from './dto/get-subcategories.dto';

@Controller({ path: 'product-sub-categories', ...globalControllerVersioning })
@ApiTags('customer/product-sub-categories')
export class ProductSubCategoriesController {
  constructor(private readonly productSubCategoriesService: ProductSubCategoriesService) {}

  @ApiBearerAuth()
  @Get()
  async getProductSubCategories(
    @Persona() customerJwtPersona: CustomerJwtPersona,
    @Query() query: GetSubCategoriesQueryDto,
  ) {
    const productSubCategories = await this.productSubCategoriesService.getProductSubCategories(
      query,
      customerJwtPersona._id,
    );
    return new CustomResponse().success({
      payload: productSubCategories,
    });
  }

  @IsPrivateAuthOrPublic()
  @Get('public')
  async getGuestProductSubCategories(@Query() query: GetSubCategoriesQueryDto) {
    const productSubCategories = await this.productSubCategoriesService.getProductSubCategories(query);
    return new CustomResponse().success({
      payload: productSubCategories,
    });
  }
}
