import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@branches/shared/constants';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { GetBranchesQueryDto } from './dto/get-branches-query.dto';
import { BranchesService } from './branches.service';
import { BranchIdParamDto } from '@branches/shared/dto/branch-id-param.dto';

@Controller({ path: 'branches', ...globalControllerVersioning })
@ApiTags('user')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @ApiBearerAuth()
  async getBranches(@Persona() userJwt: UserJwtPersona, @Query() query: GetBranchesQueryDto) {
    const branches = await this.branchesService.getBranches(userJwt._id, query);

    return new CustomResponse().success({
      payload: branches,
    });
  }

  @Get(':branchId')
  @ApiBearerAuth()
  async getBranchById(@Persona() userJwt: UserJwtPersona, @Param() param: BranchIdParamDto) {
    const branch = await this.branchesService.getBranchById(userJwt._id, param);
    return new CustomResponse().success({
      payload: {
        data: branch,
      },
    });
  }

  @Get(':branchId/related-branches')
  @ApiBearerAuth()
  async getBranchRelatedBranches(
    @Persona() userJwt: UserJwtPersona,
    @Param() param: BranchIdParamDto,
    @Query() query: GetBranchesQueryDto,
  ) {
    const branchRelatedBranches = await this.branchesService.getBranchRelatedBranches(userJwt._id, param, query);
    return new CustomResponse().success({
      payload: branchRelatedBranches,
    });
  }
}
