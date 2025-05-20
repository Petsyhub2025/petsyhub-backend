import { Module } from '@nestjs/common';
import { CityMongooseModule } from '../mongoose/city/city.module';
import { ReverseGeocoderService } from './services';

@Module({
  imports: [CityMongooseModule],
  providers: [ReverseGeocoderService],
  exports: [ReverseGeocoderService],
})
export class ReverseGeocoderModule {}
