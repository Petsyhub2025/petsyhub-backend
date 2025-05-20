import { Module } from '@nestjs/common';
import { SharedModule } from '@serviceproviders/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [],
})
export class UserModule {}
