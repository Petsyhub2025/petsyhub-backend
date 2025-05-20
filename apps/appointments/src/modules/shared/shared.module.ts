import { Module } from '@nestjs/common';
import { AppointmentMongooseModule, PetMongooseModule } from '@instapets-backend/common';

const imports = [AppointmentMongooseModule, PetMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
