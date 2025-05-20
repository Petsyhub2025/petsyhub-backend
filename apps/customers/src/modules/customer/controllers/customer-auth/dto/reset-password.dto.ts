import { IsString, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"])[A-Za-z\d@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"]{8,}$/,
    {
      message: 'Password too weak',
    },
  )
  accessToken: string;

  @IsString()
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"])[A-Za-z\d@$!%*?&#\-+=^~_.,;:\\/()<>{}\[\]`|"]{8,}$/,
    {
      message: 'Password too weak',
    },
  )
  newPassword: string;
}
