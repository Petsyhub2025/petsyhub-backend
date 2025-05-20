import { Module } from '@nestjs/common';
import { SharedModule } from '@chat/shared-module/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
