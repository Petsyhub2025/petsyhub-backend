import { Module } from '@nestjs/common';
import { CommonModule } from '@instapets-backend/common';
import { MessageHandlerModule } from './modules/message-handler/message-handler.module';

@Module({
  imports: [
    AppModule,
    MessageHandlerModule,
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'msghandler',
      },
      useFactory: {
        default: () => ({
          memoryConfig: {
            minHeapSizeInBytes: 512 * 1024 * 1024,
            maxHeapSizeInBytes: 4096 * 1024 * 1024,
          },
        }),
      },
      inject: {
        default: [],
      },
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
