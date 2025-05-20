import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, Matches } from 'class-validator';

export class LoginEmailDto {
  @IsEmail()
  @Transform(({ obj, key }) => obj[key]?.toLowerCase?.())
  email: string;

  @IsString()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/, {
    message: 'Password too weak',
  })
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean = false;
}
