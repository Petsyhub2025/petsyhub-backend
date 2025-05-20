import { Module } from '@nestjs/common';
import { SharedModule } from '@elasticsync/shared-module/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
