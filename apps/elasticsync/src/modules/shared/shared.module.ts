import { Module } from '@nestjs/common';
import {
  AdminMongooseModule,
  AppointmentMongooseModule,
  AreaMongooseModule,
  CityMongooseModule,
  BranchServiceTypeMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  CountryMongooseModule,
  DynamicLinkMongooseModule,
  EventCategoryMongooseModule,
  EventFacilityMongooseModule,
  LostFoundMongooseModule,
  PetBreedMongooseModule,
  PetFollowMongooseModule,
  PetMongooseModule,
  PetTypeMongooseModule,
  PostMongooseModule,
  BranchMongooseModule,
  ServiceProviderMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
  UserPushNotificationMongooseModule,
  UserSegmentMongooseModule,
} from '@instapets-backend/common';
import { PaginationService } from './utils/pagination.service';

const imports = [
  AreaMongooseModule,
  CityMongooseModule,
  CountryMongooseModule,
  PetBreedMongooseModule,
  PetTypeMongooseModule,
  PetMongooseModule,
  UserMongooseModule,
  PostMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  BranchServiceTypeMongooseModule,
  ServiceProviderMongooseModule,
  BranchMongooseModule,
  AdminMongooseModule,
  UserFollowMongooseModule,
  PetFollowMongooseModule,
  EventCategoryMongooseModule,
  EventFacilityMongooseModule,
  AppointmentMongooseModule,
  UserSegmentMongooseModule,
  DynamicLinkMongooseModule,
  UserPushNotificationMongooseModule,
  LostFoundMongooseModule,
];
const providers = [PaginationService];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
