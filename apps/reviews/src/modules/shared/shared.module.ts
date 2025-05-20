import { Module } from '@nestjs/common';
import { BranchMongooseModule, ReviewMongooseModule } from '@instapets-backend/common';

const imports = [ReviewMongooseModule, BranchMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
