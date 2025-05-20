import { Module } from '@nestjs/common';
import { SharedModule } from '@reviews/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class AdminModule {}
