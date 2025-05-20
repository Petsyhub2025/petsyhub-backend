import { Module } from '@nestjs/common';
import {
  CommentMongooseModule,
  CommentReplyMongooseModule,
  LikeMongooseModule,
  PetMongooseModule,
  PostMongooseModule,
  UserFollowMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

const imports = [
  UserMongooseModule,
  PostMongooseModule,
  PetMongooseModule,
  UserFollowMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  LikeMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
