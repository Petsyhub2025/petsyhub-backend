import { Module } from '@nestjs/common';
import { TopicsController } from './controllers/topics/topics.controller';
import { TopicsService } from './controllers/topics/topics.service';
import { SharedModule } from '@topics/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [TopicsController],
  providers: [TopicsService],
})
export class UserModule {}
