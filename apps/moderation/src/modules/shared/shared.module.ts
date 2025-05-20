import { Module } from '@nestjs/common';
import {
  CommentMongooseModule,
  CommentReplyMongooseModule,
  MongooseCommonModule,
  PostMongooseModule,
  ReportMongooseModule,
  UserMongooseModule,
} from '@instapets-backend/common';

const imports = [
  MongooseCommonModule.forRoot(),
  UserMongooseModule,
  PostMongooseModule,
  CommentMongooseModule,
  CommentReplyMongooseModule,
  ReportMongooseModule,
];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
