import { CustomerAddressTypeEnum } from '@common/schemas/mongoose/customer/customer-address/customer-address.enum';
import { LocationDto } from '@instapets-backend/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMobilePhone,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AddAddressDto {
  @IsObject()
  @ValidateNested()
  location?: LocationDto;

  @IsString()
  @MinLength(2)
  @ApiProperty({ type: String })
  streetName: string;

  @IsMobilePhone(null, { strictMode: true })
  @ApiProperty({ type: String })
  phoneNumber: string;

  @IsBoolean()
  @ApiProperty({ type: Boolean })
  isDefault: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  buildingName?: string;

  @IsOptional()
  @IsNumber()
  @ApiPropertyOptional({ type: Number })
  apartmentNumber?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  floor?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  additionalNotes?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  landMark?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  labelName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  houseName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String })
  companyName?: string;

  @IsEnum(CustomerAddressTypeEnum)
  @IsString()
  @ApiProperty({ type: String, enum: CustomerAddressTypeEnum })
  addressType: CustomerAddressTypeEnum;
}
