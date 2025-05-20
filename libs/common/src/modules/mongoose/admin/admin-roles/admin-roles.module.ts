import { ModelNames } from '@common/constants';
import { FactoryProvider, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getConnectionToken } from '@nestjs/mongoose';
import { AdminMongooseModule } from '../admin.module';
import { AdminRoleSchemaFactory } from '@common/schemas/mongoose/admin/admin-role/admin-role.schema';
import { AdminRolesEventListener } from '@common/schemas/mongoose/admin/admin-role/admin-role-listener';

const AdminRolesMongooseDynamicModule: FactoryProvider = {
  provide: ModelNames.ADMIN_ROLE,
  inject: [getConnectionToken(), EventEmitter2],
  useFactory: AdminRoleSchemaFactory,
};

const adminRolesProviders = [AdminRolesMongooseDynamicModule, AdminRolesEventListener];

@Module({
  imports: [AdminMongooseModule],
  providers: adminRolesProviders,
  exports: adminRolesProviders,
})
export class AdminRolesMongooseModule {}
