import { TopicMongooseModule } from '@instapets-backend/common';
import { Module } from '@nestjs/common';

const imports = [TopicMongooseModule];
const providers = [];

@Module({
  imports,
  providers,
  exports: [...imports, ...providers],
})
export class SharedModule {}
