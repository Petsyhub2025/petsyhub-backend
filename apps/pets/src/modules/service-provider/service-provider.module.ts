import { Module } from '@nestjs/common';
import { SharedModule } from '@pets/shared/shared.module';
import { PetTypesController } from './pet-types/pet-types.controller';
import { PetTypesService } from './pet-types/pet-types.service';

@Module({
  imports: [SharedModule],
  controllers: [PetTypesController],
  providers: [PetTypesService],
})
export class ServiceProviderModule {}
