import { IsMongoId } from 'class-validator';

export class ProviderIdParamDto {
  @IsMongoId()
  providerId: string;
}
