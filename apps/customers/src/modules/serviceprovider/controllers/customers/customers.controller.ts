import { Controller, Get, Param, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ServiceProviderJwtPersona,
  CustomResponse,
  NoApiVersion,
  Persona,
  ServiceProviderPermission,
  BranchAccessResourcesEnum,
  BranchAccessResourceOperationsEnum,
} from '@instapets-backend/common';
import { CustomersService } from './customers.service';
import { GetCustomersQueryDto } from './dto/get-customers.dto';
import { BranchIdQueryDto } from '@customers/serviceprovider/shared/dto/branch-id-query.dto';
import { CustomerIdParamDto } from '@customers/serviceprovider/shared/dto/customer-id-param.dto';
import { GetCustomersOrdersQueryDto } from './dto/get-customers-orders.dto';

@Controller({ path: 'customers', version: VERSION_NEUTRAL })
@ApiTags('serviceprovider')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.CUSTOMERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getCustomers(@Persona() serviceProviderJWT: ServiceProviderJwtPersona, @Query() query: GetCustomersQueryDto) {
    const customers = await this.customersService.getCustomers(serviceProviderJWT._id, query);
    return new CustomResponse().success({
      payload: customers,
    });
  }

  @Get(':customerId')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.CUSTOMERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getCustomerDetails(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Query() query: BranchIdQueryDto,
    @Param() param: CustomerIdParamDto,
  ) {
    const customer = await this.customersService.getCustomerDetails(serviceProviderJWT._id, param, query);
    return new CustomResponse().success({
      payload: { data: customer },
    });
  }

  @Get(':customerId/orders')
  @ApiBearerAuth()
  @NoApiVersion()
  @ServiceProviderPermission({
    resource: BranchAccessResourcesEnum.CUSTOMERS,
    operation: BranchAccessResourceOperationsEnum.READ,
  })
  async getCustomerOrders(
    @Persona() serviceProviderJWT: ServiceProviderJwtPersona,
    @Query() query: GetCustomersOrdersQueryDto,
    @Param() param: CustomerIdParamDto,
  ) {
    const customerOrders = await this.customersService.getCustomersOrders(serviceProviderJWT._id, param, query);
    return new CustomResponse().success({
      payload: customerOrders,
    });
  }
}
