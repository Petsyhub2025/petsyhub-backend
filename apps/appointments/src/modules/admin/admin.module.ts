import { Module } from '@nestjs/common';
import { SharedModule } from '@appointments/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
