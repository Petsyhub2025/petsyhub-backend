import { Module } from '@nestjs/common';
import { DbIndexesService } from './services/db-indexes.service';
import { SharedModule } from '@db-ops/modules/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [],
  providers: [DbIndexesService],
})
export class DbIndexesModule {}
