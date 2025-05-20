import { Controller, Get, Query, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CustomResponse, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';
import { AppVersionsService } from './app-versions.service';
import { GetAppVersionQueryDto } from './dto/get-app-version.dto';

@Controller({ path: 'app-versions', version: VERSION_NEUTRAL })
@ApiTags('user/app-versions')
export class AppVersionsController {
  constructor(private readonly appVersionsService: AppVersionsService) {}

  @IsPrivateAuthOrPublic()
  @Get('public')
  @NoApiVersion()
  async getAppVersion(@Query() query: GetAppVersionQueryDto) {
    const appVersion = await this.appVersionsService.getAppVersion(query);

    return new CustomResponse().success({
      payload: { data: appVersion },
    });
  }
}
