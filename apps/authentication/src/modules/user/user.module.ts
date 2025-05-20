import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './controllers/user.service';
import { UserJWTStrategy } from './strategies/user-jwt.strategy';
import { UserMongooseModule } from '@instapets-backend/common';

@Module({
  imports: [UserMongooseModule],
  controllers: [UserController],
  providers: [UserService, UserJWTStrategy],
})
export class UserModule {}
