import { IsNotEmpty, IsString } from 'class-validator';

export class UnregisterFCMTokenDto {
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}
