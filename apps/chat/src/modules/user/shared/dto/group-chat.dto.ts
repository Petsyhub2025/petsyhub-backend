import { IsMongoId } from 'class-validator';

export class GroupChatParamDto {
  @IsMongoId()
  groupChatRoomId: string;
}
