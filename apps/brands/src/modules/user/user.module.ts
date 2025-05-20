import { Module } from '@nestjs/common';
import { SharedModule } from '@brands/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
