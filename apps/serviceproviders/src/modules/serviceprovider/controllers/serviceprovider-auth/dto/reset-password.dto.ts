import { IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(/^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/, {
    message: 'Invalid access token',
  })
  accessToken: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Password too weak',
  })
  newPassword: string;
}
