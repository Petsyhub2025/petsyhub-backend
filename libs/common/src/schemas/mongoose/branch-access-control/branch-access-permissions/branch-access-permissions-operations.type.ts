import { IsBoolean } from 'class-validator';

export enum BranchAccessResourceOperationsEnum {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  FILTER = 'filter',
}

export class BranchAccessPermissionOperations implements Record<BranchAccessResourceOperationsEnum, boolean> {
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
