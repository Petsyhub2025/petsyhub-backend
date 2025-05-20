import { IsMongoId } from 'class-validator';

export class ServiceProviderIdParamDto {
  @IsMongoId()
  serviceProviderId: string;
}
