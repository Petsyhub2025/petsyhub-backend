import { Body, Controller, Get, Param, Patch, Post, Put, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ServiceProviderJwtPersona,
  ServiceProviderPermission,
  CustomResponse,
  NoApiVersion,
  Persona,
  BranchAccessResourcesEnum,
  BranchAccessResourceOperationsEnum,
} from '@instapets-backend/common';
import { InventoryService } from './inventory.service';
import { GetInventoryDto } from './dto/get-inventory.dto';
import { AddProductToInventoryDto } from './dto/add-to-inventory.dto';
import { UpdateProductToInventoryDto } from './dto/update-product-inventory.dto';
import { ProductIdParamDto } from '@inventory/shared/dto/product-param-id.dto';

@Controller({ path: 'inventory', version: VERSION_NEUTRAL })
@ApiTags('serviceProvider/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.INVENTORY,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getInventory(@Persona() serviceProviderJWT: ServiceProviderJwtPersona, @Query() query: GetInventoryDto) {
    const inventoryProducts = await this.inventoryService.getInventory(serviceProviderJWT._id, query);
    return new CustomResponse().success({
      payload: inventoryProducts,
    });
  }

  @Post()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.INVENTORY,
    operation: BranchAccessResourceOperationsEnum.CREATE,
  })
  async createInventory(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Body() body: AddProductToInventoryDto,
  ) {
    await this.inventoryService.addProductToInventory(serviceProviderJWT._id, body);
    return new CustomResponse().success({});
  }

  @Patch('products/:productId')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.INVENTORY,
    operation: BranchAccessResourceOperationsEnum.UPDATE,
  })
  async editProductToInventory(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Body() body: UpdateProductToInventoryDto,
    @Param() param: ProductIdParamDto,
  ) {
    await this.inventoryService.editProductToInventory(serviceProviderJWT._id, body, param);
    return new CustomResponse().success({});
  }
}
