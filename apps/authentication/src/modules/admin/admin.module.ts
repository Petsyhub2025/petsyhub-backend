import { Module } from '@nestjs/common';
import { AdminController } from './controllers/admin.controller';
import { AdminService } from './controllers/admin.service';
import { AdminJWTStrategy } from './strategies/admin-jwt.strategy';
import { AdminMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [AdminMongooseModule],
  controllers: [AdminController],
  providers: [AdminService, AdminJWTStrategy],
})
export class AdminModule {}
