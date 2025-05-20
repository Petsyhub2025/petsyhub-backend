import { Body, Controller, Get, Param, Post, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { BrandService } from './brand.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  NoApiVersion,
  Persona,
  AdminJwtPersona,
  BasePaginationQuery,
  GetImagePreSignedUrlQueryDto,
} from '@instapets-backend/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { BrandIdParamDto } from '@brands/shared/dto/brand-id-param.dto';

@Controller({ path: 'brands', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class BrandController {
  constructor(private brandService: BrandService) {}

  @ApiBearerAuth()
  @NoApiVersion()
  @Post()
  @AdminPermission({ resource: AdminResourcesEnum.BRANDS, operation: AdminResourceOperationsEnum.CREATE })
  async createBrand(@Persona() adminJwt: AdminJwtPersona, @Body() body: CreateBrandDto) {
    await this.brandService.createBrand(adminJwt._id, body);
    return new CustomResponse().success({});
  }

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @AdminPermission({ resource: AdminResourcesEnum.BRANDS, operation: AdminResourceOperationsEnum.READ })
  async getProductCategories(@Persona() adminJWT: AdminJwtPersona, @Query() query: BasePaginationQuery) {
    const brands = await this.brandService.getAllBrands(adminJWT._id, query);
    return new CustomResponse().success({
      payload: brands,
    });
  }

  @ApiBearerAuth()
  @Get('pre-signed-url')
  @AdminPermission({ resource: AdminResourcesEnum.BRANDS, operation: AdminResourceOperationsEnum.UPDATE })
  async getUploadPreSignedUrl(@Persona() adminJWT: AdminJwtPersona, @Query() query: GetImagePreSignedUrlQueryDto) {
    const data = await this.brandService.generatePresignedUrl(adminJWT._id, query);

    return new CustomResponse().success({
      payload: { data },
    });
  }

  @ApiBearerAuth()
  @NoApiVersion()
  @Get(':brandId')
  @AdminPermission({ resource: AdminResourcesEnum.BRANDS, operation: AdminResourceOperationsEnum.READ })
  async getBrandById(@Persona() adminJwt: AdminJwtPersona, @Param() params: BrandIdParamDto) {
    const brand = await this.brandService.getBrandById(adminJwt._id, params);
    return new CustomResponse().success({
      payload: { data: brand },
    });
  }
}
