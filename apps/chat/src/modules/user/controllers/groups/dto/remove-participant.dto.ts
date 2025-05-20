import { IsMongoId } from 'class-validator';

export class removeParticipantQueryDto {
  @IsMongoId()
  participant: string;
}
