import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { BrandService } from './brand.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BasePaginationQuery,
  BranchAccessResourceOperationsEnum,
  BranchAccessResourcesEnum,
  BrandOwnerGuard,
  CustomResponse,
  NoApiVersion,
  Persona,
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
} from '@instapets-backend/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandIdParamDto } from '@brands/shared/dto/brand-id-param.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

@Controller({ path: 'brands', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @ApiBearerAuth()
  @NoApiVersion()
  @Post()
  async createBrand(@Persona() serviceProviderJwt: ServiceProviderJwtPersona, @Body() body: CreateBrandDto) {
    const createdBrand = await this.brandService.createBrand(serviceProviderJwt._id, body);
    return new CustomResponse().success({
      payload: { data: createdBrand },
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get('suppliers')
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.PRODUCTS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getAllSuppliersBrands(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Query() query: BasePaginationQuery,
  ) {
    const result = await this.brandService.getAllSupplierBrands(serviceProviderJwt._id, query);
    return new CustomResponse().success({
      payload: result,
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get(':brandId')
  async getBrandById(@Persona() serviceProviderJwt: ServiceProviderJwtPersona, @Param() params: BrandIdParamDto) {
    const brand = await this.brandService.getBrandById(serviceProviderJwt._id, params);
    return new CustomResponse().success({
      payload: { data: brand },
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @UseGuards(BrandOwnerGuard)
  @Patch(':brandId')
  async updateBrand(
    @Persona() serviceProviderJwt: ServiceProviderJwtPersona,
    @Param() params: BrandIdParamDto,
    @Body() body: UpdateBrandDto,
  ) {
    const updatedBrand = await this.brandService.updateBrand(serviceProviderJwt._id, params, body);
    return new CustomResponse().success({
      payload: { data: updatedBrand },
    });
  }
}
