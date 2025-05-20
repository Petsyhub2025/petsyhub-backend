import { IsMongoId } from 'class-validator';

export class BrandIdParamDto {
  @IsMongoId()
  brandId: string;
}
