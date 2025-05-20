import { Module } from '@nestjs/common';
import { SharedModule } from '@pets/shared/shared.module';
import { FiltersController } from './controllers/filters/filters.controller';
import { FiltersService } from './controllers/filters/filters.service';
import { FoundPostsController } from './controllers/found-posts/found-posts.controller';
import { FoundPostsService } from './controllers/found-posts/found-posts.service';
import { LostPostsController } from './controllers/lost-posts/lost-posts.controller';
import { LostPostsService } from './controllers/lost-posts/lost-posts.service';
import { PetBreedsController } from './controllers/pet-breeds/pet-breeds.controller';
import { PetBreedsService } from './controllers/pet-breeds/pet-breeds.service';
import { PetTypesController } from './controllers/pet-types/pet-types.controller';
import { PetTypesService } from './controllers/pet-types/pet-types.service';
import { PetsController } from './controllers/pets/pets.controller';
import { PetsService } from './controllers/pets/pets.service';

@Module({
  imports: [SharedModule],
  controllers: [
    PetBreedsController,
    PetTypesController,
    PetsController,
    LostPostsController,
    FoundPostsController,
    FiltersController,
  ],
  providers: [PetBreedsService, PetTypesService, PetsService, LostPostsService, FoundPostsService, FiltersService],
})
export class AdminModule {}
