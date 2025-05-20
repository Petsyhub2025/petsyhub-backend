import { Module } from '@nestjs/common';
import { DataTransformationModule } from './modules/data-transformation/data-transformation.module';
import { DbIndexesModule } from './modules/db-indexes/db-indexes.module';
import { CommonModule } from '@instapets-backend/common';

@Module({
  imports: [
    CommonModule.registerAsync({
      appConfig: {
        appShortName: 'db-ops',
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

    DataTransformationModule,
    DbIndexesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
