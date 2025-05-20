import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductCategoriesService } from './product-categories.service';
import {
  CustomResponse,
  Persona,
  BasePaginationQuery,
  CustomerJwtPersona,
  IsPrivateAuthOrPublic,
} from '@instapets-backend/common';
import { globalControllerVersioning } from '@products/shared/constants';

@Controller({ path: 'product-categories', ...globalControllerVersioning })
@ApiTags('customer/product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get()
  @ApiBearerAuth()
  async getProductCategories(@Persona() customerJwtPersona: CustomerJwtPersona, @Query() query: BasePaginationQuery) {
    const productCategories = await this.productCategoriesService.getProductCategories(query, customerJwtPersona._id);
    return new CustomResponse().success({
      payload: productCategories,
    });
  }

  @Get('public')
  @IsPrivateAuthOrPublic()
  async getGuestProductCategories(@Query() query: BasePaginationQuery) {
    const productCategories = await this.productCategoriesService.getProductCategories(query);
    return new CustomResponse().success({
      payload: productCategories,
    });
  }
}
