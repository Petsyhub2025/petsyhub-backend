import { Module } from '@nestjs/common';
import { SharedModule } from '@areas/shared-module/shared.module';
import { CitiesController } from './controllers/cities/cities.controller';
import { CountriesController } from './controllers/countries/countries.controller';
import { CountriesService } from './controllers/countries/countries.service';
import { CitiesService } from './controllers/cities/cities.service';
import { AreasController } from './controllers/areas/areas.controller';
import { AreasService } from './controllers/areas/areas.service';

@Module({
  imports: [SharedModule],
  controllers: [CitiesController, CountriesController, AreasController],
  providers: [CountriesService, CitiesService, AreasService],
})
export class UserModule {}
