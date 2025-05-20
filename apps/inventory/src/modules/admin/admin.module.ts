import { Module } from '@nestjs/common';
import { SharedModule } from '@inventory/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
