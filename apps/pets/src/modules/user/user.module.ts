import { Module } from '@nestjs/common';
import { SharedModule } from '@pets/shared/shared.module';
import { PetsController } from './controllers/pets/pets.controller';
import { PetsService } from './controllers/pets/pets.service';
import { PetBreedsController } from './controllers/pet-breeds/pet-breeds.controller';
import { PetTypesController } from './controllers/pet-types/pet-types.controller';
import { PetBreedsService } from './controllers/pet-breeds/pet-breeds.service';
import { PetTypesService } from './controllers/pet-types/pet-types.service';
import { AppConfig, AwsS3Module, PetMatchMongooseModule, UserBlockMongooseModule } from '@instapets-backend/common';
import { PendingPetFollowEventListener } from './event-listeners/pending-pet-follow.listener';
import { PetFollowEventListener } from './event-listeners/pet-follow.listener';
import { LostPostsController } from './controllers/lost-posts/lost-posts.controller';
import { FoundPostsController } from './controllers/found-posts/found-posts.controller';
import { LostPostsService } from './controllers/lost-posts/lost-posts.service';
import { FoundPostsService } from './controllers/found-posts/found-posts.service';
import { LostFoundLocationHelperService } from './shared/services/lost-found-location-helper.service';
import { MatchesController } from './controllers/matches/matches.controller';
import { MatchesService } from './controllers/matches/matches.service';
import { PetMatchEventListener } from './event-listeners/pet-match.listener';

@Module({
  imports: [SharedModule, UserBlockMongooseModule, PetMatchMongooseModule],
  controllers: [
    PetsController,
    PetBreedsController,
    PetTypesController,
    LostPostsController,
    FoundPostsController,
    MatchesController,
  ],
  providers: [
    PetsService,
    PetBreedsService,
    PetTypesService,
    PendingPetFollowEventListener,
    PetFollowEventListener,
    PetMatchEventListener,
    LostPostsService,
    FoundPostsService,
    MatchesService,
    LostFoundLocationHelperService,
  ],
})
export class UserModule {}
