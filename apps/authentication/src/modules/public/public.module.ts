import { Module } from '@nestjs/common';
import { AuthErrorController } from './controllers/auth-error/auth-error.controller';
import { AuthErrorService } from './controllers/auth-error/auth-error.service';

@Module({
  imports: [],
  controllers: [AuthErrorController],
  providers: [AuthErrorService],
})
export class PublicModule {}
