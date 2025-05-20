import { IsMongoId } from 'class-validator';

export class DynamicLinkIdParamDto {
  @IsMongoId()
  dynamicLinkId: string;
}
