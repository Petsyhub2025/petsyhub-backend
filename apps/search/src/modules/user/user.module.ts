import { Module } from '@nestjs/common';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import { SharedModule } from '@search/shared-module/shared.module';
import { PetFollowsRpcHandlerService } from './controllers/pet-follow/message-handlers/rpc/handler.service';
import { PetFollowsRpcReceiverService } from './controllers/pet-follow/message-handlers/rpc/receiver.service';
import { PetsRpcHandlerService } from './controllers/pets/message-handlers/rpc/handler.service';
import { PetsRpcReceiverService } from './controllers/pets/message-handlers/rpc/receiver.service';
import { UserFollowsRpcHandlerService } from './controllers/user-follow/message-handlers/rpc/handler.service';
import { UserFollowsRpcReceiverService } from './controllers/user-follow/message-handlers/rpc/receiver.service';
import { UsersRpcHandlerService } from './controllers/users/message-handlers/rpc/handler.service';
import { UsersRpcReceiverService } from './controllers/users/message-handlers/rpc/receiver.service';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [
    ElasticSearchHelperService,
    UsersRpcHandlerService,
    UsersRpcReceiverService,
    PetsRpcHandlerService,
    PetsRpcReceiverService,
    UserFollowsRpcHandlerService,
    UserFollowsRpcReceiverService,
    PetFollowsRpcHandlerService,
    PetFollowsRpcReceiverService,
  ],
})
export class UserModule {}
