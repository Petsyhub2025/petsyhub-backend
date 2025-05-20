import { IsMongoId } from 'class-validator';

export class TopicIdParamDto {
  @IsMongoId()
  topicId: string;
}
