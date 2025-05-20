import { Module } from '@nestjs/common';
import { UsersController } from './controllers/users/users.controller';
import { UsersService } from './controllers/users/users.service';
import { SharedModule } from '@users/shared/shared.module';
import { FiltersController } from './controllers/filters/filters.controller';
import { FiltersService } from './controllers/filters/filters.service';
import { TemplateManagerService } from '@instapets-backend/common';
@Module({
  imports: [SharedModule],
  controllers: [UsersController, FiltersController],
  providers: [UsersService, FiltersService, TemplateManagerService],
})
export class AdminModule {}
