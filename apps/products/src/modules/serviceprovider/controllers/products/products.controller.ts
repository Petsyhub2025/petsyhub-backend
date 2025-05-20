import { Body, Controller, Get, Param, Patch, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import {
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
  CustomResponse,
  NoApiVersion,
  Persona,
  BranchAccessResourcesEnum,
  BranchAccessResourceOperationsEnum,
} from '@instapets-backend/common';
import { ProductIdParamDto } from '@products/shared/dto/product-param-id.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { BranchIdQueryDto } from '@products/shared/dto/branch-id-query.dto';

@Controller({ path: 'products', version: VERSION_NEUTRAL })
@ApiTags('serviceProvider/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.PRODUCTS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getProducts(@Persona() serviceProviderJWT: ServiceProviderJwtPersona, @Query() query: GetProductsDto) {
    const products = await this.productsService.getProducts(serviceProviderJWT._id, query);
    return new CustomResponse().success({
      payload: products,
    });
  }

  @Get(':productId')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.PRODUCTS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getProductById(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Param() param: ProductIdParamDto,
    @Query() query: BranchIdQueryDto,
  ) {
    const product = await this.productsService.getProductById(serviceProviderJWT._id, param, query);
    return new CustomResponse().success({
      payload: {
        data: product,
      },
    });
  }
}
