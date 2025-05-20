import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@users/shared/constants';
import { CustomResponse, GetImagePreSignedUrlQueryDto, Persona, UserJwtPersona } from '@instapets-backend/common';
import { EditProfileDto } from './dto/edit-profile.dto';
import { UserIdOrUsernameParamDto } from './dto/user-id-or-username-param.dto';
import { UserProfileService } from './user-profile.service';

@Controller({ path: 'profile', ...globalControllerVersioning })
@ApiTags('user/profile')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get()
  @ApiBearerAuth()
  async getProfile(@Persona() userJWT: UserJwtPersona) {
    const user = await this.userProfileService.getUserProfile(userJWT._id);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @Patch()
  @ApiBearerAuth()
  async editProfile(@Persona() userJWT: UserJwtPersona, @Body() body: EditProfileDto) {
    const user = await this.userProfileService.editProfile(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }

  @Delete()
  @ApiBearerAuth()
  async deleteProfile(@Persona() userJWT: UserJwtPersona) {
    await this.userProfileService.deleteProfile(userJWT._id);

    return new CustomResponse().success({});
  }

  @Get(':userIdOrUsername')
  @ApiBearerAuth()
  async getViewedUserProfile(@Persona() userJWT: UserJwtPersona, @Param() params: UserIdOrUsernameParamDto) {
    const user = await this.userProfileService.getViewedUserProfile(userJWT._id, params);

    return new CustomResponse().success({
      payload: { data: user },
    });
  }
}
