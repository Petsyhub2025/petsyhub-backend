import { IsMongoId } from 'class-validator';

export class VersionIdParamDto {
  @IsMongoId()
  versionId: string;
}
