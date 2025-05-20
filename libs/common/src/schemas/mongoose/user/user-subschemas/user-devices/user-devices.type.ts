import { VersionType } from '@common/schemas/mongoose/marketing/user-segment/user-segment-subschemas/user-device/version';
import { UserFCMTokenPlatformEnum } from '@common/schemas/mongoose/user/user-fcm-token';
import { IsEnum, IsObject, IsString, ValidateNested } from 'class-validator';

export class UserDevicesSubSchemaType {
  @IsString()
  @IsEnum(UserFCMTokenPlatformEnum)
  platform: UserFCMTokenPlatformEnum;

  @IsObject()
  @ValidateNested()
  installedVersion: VersionType;
}
