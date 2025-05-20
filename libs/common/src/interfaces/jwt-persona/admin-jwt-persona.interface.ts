import { AdminPermissions } from '@common/schemas/mongoose/admin/admin-permissions';

export interface AdminJwtPersona {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  permissions: AdminPermissions;
  iat: number;
  exp: number;
}
