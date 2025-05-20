import { PartialType } from '@nestjs/swagger';
import { CreateUserPushNotificationDto } from './create-push-notification.dto';

export class UpdateUserPushNotificationDto extends PartialType(CreateUserPushNotificationDto) {}
