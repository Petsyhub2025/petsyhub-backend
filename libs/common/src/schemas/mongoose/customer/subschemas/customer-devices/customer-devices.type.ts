import { VersionType } from '@common/schemas/mongoose/marketing/user-segment/user-segment-subschemas/user-device/version';
import { IsEnum, IsObject, IsString, ValidateNested } from 'class-validator';
import { CustomerFCMTokenPlatformEnum } from '@common/schemas/mongoose/customer/customer-fcm-token';

export class CustomerDevicesSubSchemaType {
  @IsString()
  @IsEnum(CustomerFCMTokenPlatformEnum)
  platform: CustomerFCMTokenPlatformEnum;

  @IsObject()
  @ValidateNested()
  installedVersion: VersionType;
}
