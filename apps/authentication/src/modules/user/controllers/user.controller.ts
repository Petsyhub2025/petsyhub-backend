import { Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserJwtAuthGuard } from '@authentication/user/guards/user-jwt.guard';
import { CustomResponse, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';

@Controller({ path: 'user', version: VERSION_NEUTRAL })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @ApiBearerAuth()
  @UseGuards(UserJwtAuthGuard)
  @Post('authentication')
  authenticateUser(): CustomResponse {
    return new CustomResponse().success({
      event: 'USER_AUTHENTICATE_SUCCESS',
      localizedMessage: {
        en: 'User authenticated successfully',
        ar: 'تم تأكيد المستخدم بنجاح',
      },
      statusCode: 200,
    });
  }
}
