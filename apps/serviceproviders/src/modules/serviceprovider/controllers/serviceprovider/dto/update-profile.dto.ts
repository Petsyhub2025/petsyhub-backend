import { IsOptional, IsPhoneNumber, IsString, IsUrl, MaxLength } from 'class-validator';

export class UpdateServiceProviderProfileDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsPhoneNumber()
  @IsOptional()
  phoneNumber?: string;

  @IsPhoneNumber()
  @IsOptional()
  anotherPhoneNumber?: string;
}
