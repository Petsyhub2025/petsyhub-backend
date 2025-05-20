import { PartialType } from '@nestjs/swagger';
import { AddAddressDto } from './add-address.dto';

export class EditAddressDto extends PartialType(AddAddressDto) {}
