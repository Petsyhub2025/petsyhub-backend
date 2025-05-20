import { UserFCMTokenPlatformEnum } from '@instapets-backend/common';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';

export class RegisterUserFCMTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]+(\.[0-9]+)*$/)
  appVersion: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(UserFCMTokenPlatformEnum)
  platform: UserFCMTokenPlatformEnum;
}
