import { Body, Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { MediaModerationService } from './media-moderation.service';
import { NoApiVersion, IsPrivateAuthOrPublic, VerifyS2SJwtToken, CustomResponse } from '@instapets-backend/common';
import { UpdateSensitiveContentDto } from './dto/update-sensitive-content.dto';

@Controller({ path: 'media-moderation', version: VERSION_NEUTRAL })
@ApiTags('media-moderation')
export class MediaModerationController {
  constructor(private readonly mediaModerationService: MediaModerationService) {}

  @ApiBearerAuth()
  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('private-auth/update-sensitive-content')
  async updateSensitiveContent(@Body() body: UpdateSensitiveContentDto) {
    await this.mediaModerationService.updateSensitiveContent(body);

    return new CustomResponse().success({});
  }
}
