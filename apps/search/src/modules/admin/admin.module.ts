import { Module } from '@nestjs/common';
import { SharedModule } from '@search/shared-module/shared.module';
import { ElasticSearchHelperService } from '@search/shared-module/helper-services';
import { CountryRpcHandlerService } from './controllers/countries/message-handlers/rpc/handler.service';
import { CountryRpcReceiverService } from './controllers/countries/message-handlers/rpc/receiver.service';
import { CityRpcHandlerService } from './controllers/cities/message-handlers/rpc/handler.service';
import { CityRpcReceiverService } from './controllers/cities/message-handlers/rpc/receiver.service';
import { PetBreedRpcHandlerService } from './controllers/pet-breeds/message-handlers/rpc/handler.service';
import { PetBreedRpcReceiverService } from './controllers/pet-breeds/message-handlers/rpc/receiver.service';
import { CommentRepliesRpcHandlerService } from './controllers/comment-replies/message-handlers/rpc/handler.service';
import { CommentRepliesRpcReceiverService } from './controllers/comment-replies/message-handlers/rpc/receiver.service';
import { CommentsRpcHandlerService } from './controllers/comments/message-handlers/rpc/handler.service';
import { CommentsRpcReceiverService } from './controllers/comments/message-handlers/rpc/receiver.service';
import { PetsRpcHandlerService } from './controllers/pets/message-handlers/rpc/handler.service';
import { PetsRpcReceiverService } from './controllers/pets/message-handlers/rpc/receiver.service';
import { PostsRpcHandlerService } from './controllers/posts/message-handlers/rpc/handler.service';
import { PostsRpcReceiverService } from './controllers/posts/message-handlers/rpc/receiver.service';
import { UsersRpcHandlerService } from './controllers/users/message-handlers/rpc/handler.service';
import { UsersRpcReceiverService } from './controllers/users/message-handlers/rpc/receiver.service';
import { PetTypesRpcHandlerService } from './controllers/pet-types/message-handlers/rpc/handler.service';
import { PetTypesRpcReceiverService } from './controllers/pet-types/message-handlers/rpc/receiver.service';
import { BranchServiceTypesRpcHandlerService } from './controllers/branch-service-types/message-handlers/rpc/handler.service';
import { BranchServiceTypesRpcReceiverService } from './controllers/branch-service-types/message-handlers/rpc/receiver.service';
import { ServiceProviderRpcHandlerService } from './controllers/service-providers/message-handlers/rpc/handler.service';
import { ServiceProviderRpcReceiverService } from './controllers/service-providers/message-handlers/rpc/receiver.service';
import { BranchRpcHandlerService } from './controllers/branches/message-handlers/rpc/handler.service';
import { BranchRpcReceiverService } from './controllers/branches/message-handlers/rpc/receiver.service';
import { AdminsRpcHandlerService } from './controllers/admins/message-handlers/rpc/handler.service';
import { AdminsRpcReceiverService } from './controllers/admins/message-handlers/rpc/receiver.service';
import { AreaRpcReceiverService } from './controllers/areas/message-handlers/rpc/receiver.service';
import { AreaRpcHandlerService } from './controllers/areas/message-handlers/rpc/handler.service';
import { EventCategoriesRpcHandlerService } from './controllers/event-categories/message-handlers/rpc/handler.service';
import { EventCategoriesRpcReceiverService } from './controllers/event-categories/message-handlers/rpc/receiver.service';
import { EventFacilitiesRpcHandlerService } from './controllers/event-facilities/message-handlers/rpc/handler.service';
import { EventFacilitiesRpcReceiverService } from './controllers/event-facilities/message-handlers/rpc/receiver.service';
import { AppointmentsRpcHandlerService } from './controllers/appointments/message-handlers/rpc/handler.service';
import { AppointmentsRpcReceiverService } from './controllers/appointments/message-handlers/rpc/receiver.service';
import { UserSegmentsRpcHandlerService } from './controllers/user-segments/message-handlers/rpc/handler.service';
import { UserSegmentsRpcReceiverService } from './controllers/user-segments/message-handlers/rpc/receiver.service';
import { DynamicLinksRpcHandlerService } from './controllers/dynamic-links/message-handlers/rpc/handler.service';
import { DynamicLinksRpcReceiverService } from './controllers/dynamic-links/message-handlers/rpc/receiver.service';
import { UserPushNotificationsRpcHandlerService } from './controllers/user-push-notifications/message-handlers/rpc/handler.service';
import { UserPushNotificationsRpcReceiverService } from './controllers/user-push-notifications/message-handlers/rpc/receiver.service';
import { LostFoundPostsRpcHandlerService } from './controllers/lost-found-posts/rpc/handler.service';
import { LostFoundPostsRpcReceiverService } from './controllers/lost-found-posts/rpc/receiver.service';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [
    ElasticSearchHelperService,
    CountryRpcHandlerService,
    CountryRpcReceiverService,
    CityRpcHandlerService,
    CityRpcReceiverService,
    AreaRpcHandlerService,
    AreaRpcReceiverService,
    PetBreedRpcHandlerService,
    PetBreedRpcReceiverService,
    PetTypesRpcHandlerService,
    PetTypesRpcReceiverService,
    CommentRepliesRpcHandlerService,
    CommentRepliesRpcReceiverService,
    CommentsRpcHandlerService,
    CommentsRpcReceiverService,
    PetsRpcHandlerService,
    PetsRpcReceiverService,
    PostsRpcHandlerService,
    PostsRpcReceiverService,
    UsersRpcHandlerService,
    UsersRpcReceiverService,
    BranchServiceTypesRpcHandlerService,
    BranchServiceTypesRpcReceiverService,
    ServiceProviderRpcHandlerService,
    ServiceProviderRpcReceiverService,
    BranchRpcHandlerService,
    BranchRpcReceiverService,
    AdminsRpcHandlerService,
    AdminsRpcReceiverService,
    EventCategoriesRpcHandlerService,
    EventCategoriesRpcReceiverService,
    EventFacilitiesRpcHandlerService,
    EventFacilitiesRpcReceiverService,
    AppointmentsRpcHandlerService,
    AppointmentsRpcReceiverService,
    UserSegmentsRpcHandlerService,
    UserSegmentsRpcReceiverService,
    DynamicLinksRpcHandlerService,
    DynamicLinksRpcReceiverService,
    UserPushNotificationsRpcHandlerService,
    UserPushNotificationsRpcReceiverService,
    LostFoundPostsRpcHandlerService,
    LostFoundPostsRpcReceiverService,
  ],
})
export class AdminModule {}
