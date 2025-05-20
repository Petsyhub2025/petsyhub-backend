import { Transform } from 'class-transformer';
import { IsEmail } from 'class-validator';

export class ForgetPasswordDto {
  @IsEmail()
  @Transform(({ obj, key }) => obj[key]?.toLowerCase?.())
  email: string;
}
