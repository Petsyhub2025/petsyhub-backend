import { Body, Controller, Post, UseGuards, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserPushNotificationsService } from './user-push-notifications.service';
import { ProcessUserPushNotificationDto } from './dto/process-user-push-notification.dto';
import {
  CustomLoggerService,
  CustomResponse,
  IsPrivateAuthOrPublic,
  NoApiVersion,
  VerifyS2SJwtToken,
} from '@instapets-backend/common';
import { catchError, from, of } from 'rxjs';

@Controller({ path: 'user-push-notifications', version: VERSION_NEUTRAL })
@ApiTags('user-push-notifications')
export class UserPushNotificationsController {
  constructor(
    private readonly userPushNotificationsService: UserPushNotificationsService,
    private readonly logger: CustomLoggerService,
  ) {}

  @ApiBearerAuth()
  @NoApiVersion()
  @IsPrivateAuthOrPublic()
  @UseGuards(VerifyS2SJwtToken)
  @Post('private-auth/process-user-push-notification')
  async processUserPushNotification(@Body() body: ProcessUserPushNotificationDto) {
    from(this.userPushNotificationsService.processUserPushNotification(body)).pipe(
      catchError((error) => {
        this.logger.error(`Error processing user push notification: ${error?.message}`, { error });
        return of(null);
      }),
    );

    return new CustomResponse().success({});
  }
}
