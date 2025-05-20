import { IsMongoId } from 'class-validator';

export class RoleIdParamDto {
  @IsMongoId()
  roleId: string;
}
