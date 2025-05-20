import { IsString } from 'class-validator';

export class LoginGoogleOrAppleDto {
  @IsString()
  idToken: string;
}
