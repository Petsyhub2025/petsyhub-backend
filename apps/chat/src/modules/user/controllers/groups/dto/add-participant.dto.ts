import { IsArrayUnique } from '@instapets-backend/common';
import { MAX_GROUP_PARTICIPANTS } from '@chat/user/shared/constants';
import { ArrayMaxSize, ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class AddParticipantDto {
  @IsMongoId({ each: true })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(MAX_GROUP_PARTICIPANTS - 2) //a group cant be created with less than 2 people
  @IsArrayUnique()
  participants: string[];
}
