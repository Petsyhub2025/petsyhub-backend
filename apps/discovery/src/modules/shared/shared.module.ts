import { Module } from '@nestjs/common';
import { PetMongooseModule, UserMongooseModule } from '@instapets-backend/common';

const imports = [UserMongooseModule, PetMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
