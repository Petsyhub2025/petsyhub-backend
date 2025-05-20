import { IsMongoId } from 'class-validator';

export class AdminIdParamDto {
  @IsMongoId()
  adminId: string;
}
