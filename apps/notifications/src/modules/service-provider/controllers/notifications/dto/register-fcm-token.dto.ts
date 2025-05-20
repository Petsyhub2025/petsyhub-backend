import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterFCMTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
