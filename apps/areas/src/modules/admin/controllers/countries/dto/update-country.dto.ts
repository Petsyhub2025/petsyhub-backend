import { PartialType } from '@nestjs/swagger';
import { CreateCountryBodyDto } from './create-country.dto';

export class UpdateCountryDto extends PartialType(CreateCountryBodyDto) {}
