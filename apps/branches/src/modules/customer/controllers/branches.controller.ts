import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@branches/shared/constants';
import { CustomResponse, IsPrivateAuthOrPublic, Persona, CustomerJwtPersona } from '@instapets-backend/common';
import { BranchesService } from './branches.service';
import { GetNearByShopsQueryDto } from './dto/get-nearby-shops.dto';
import { GetNearByShopQueryDto } from './dto/get-nearby-shop.dto';
import { ShopIdParamDto } from '@branches/customer/shared/dto/shop-id-param.dto';

@Controller({ path: 'branches', ...globalControllerVersioning })
@ApiTags('customer')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get('nearby-shops')
  @ApiBearerAuth()
  async getNearByShops(@Persona() customerJwt: CustomerJwtPersona, @Query() query: GetNearByShopsQueryDto) {
    const nearByShops = await this.branchesService.getNearByShops(query, customerJwt._id);

    return new CustomResponse().success({
      payload: nearByShops,
    });
  }

  @Get('public/nearby-shops')
  @IsPrivateAuthOrPublic()
  async getNearByShopsGuest(@Query() query: GetNearByShopsQueryDto) {
    const nearByShops = await this.branchesService.getNearByShops(query);

    return new CustomResponse().success({
      payload: nearByShops,
    });
  }

  @Get('nearby-shops/:shopId')
  @ApiBearerAuth()
  async getNearByShopById(
    @Persona() customerJwt: CustomerJwtPersona,
    @Param() param: ShopIdParamDto,
    @Query() query: GetNearByShopQueryDto,
  ) {
    const nearByShopDetails = await this.branchesService.getNearByShopById(param, query, customerJwt._id);

    return new CustomResponse().success({
      payload: {
        data: nearByShopDetails,
      },
    });
  }

  @Get('public/nearby-shops/:shopId')
  @IsPrivateAuthOrPublic()
  async getNearByShopByIdGuest(@Param() param: ShopIdParamDto, @Query() query: GetNearByShopQueryDto) {
    const nearByShopDetails = await this.branchesService.getNearByShopById(param, query);

    return new CustomResponse().success({
      payload: {
        data: nearByShopDetails,
      },
    });
  }
}
