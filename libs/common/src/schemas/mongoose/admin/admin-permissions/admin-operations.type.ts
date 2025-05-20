import { IsBoolean } from 'class-validator';

export enum AdminResourceOperationsEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  FILTER = 'filter',
}

export class AdminPermissionOperations implements Record<AdminResourceOperationsEnum, boolean> {
  @IsBoolean()
  create: boolean;

  @IsBoolean()
  read: boolean;

  @IsBoolean()
  update: boolean;

  @IsBoolean()
  delete: boolean;

  @IsBoolean()
  filter: boolean;
}
