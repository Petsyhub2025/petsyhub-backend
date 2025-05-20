import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class RequestMatchDto {
  @IsUUID()
  @ApiProperty({ type: String })
  petId: string; // This is not the mongodb pet id, this is a uuid conforming to a private id for a pet.
}
