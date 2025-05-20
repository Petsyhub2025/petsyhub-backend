import { Module } from '@nestjs/common';
import {
  CommentMongooseModule,
  CommentReplyMongooseModule,
  LikeMongooseModule,
  MongooseCommonModule,
  PetFollowMongooseModule,
  PetMongooseModule,
  PostMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

const imports = [
  MongooseCommonModule.forRoot(),
  UserMongooseModule,
  PetMongooseModule,
  PostMongooseModule,
  LikeMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  UserFollowMongooseModule,
  PetFollowMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
