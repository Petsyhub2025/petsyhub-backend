import { Module } from '@nestjs/common';
import { SharedModule } from '@admins/shared-module/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
