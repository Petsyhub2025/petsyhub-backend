import { IsMongoId } from 'class-validator';

export class EventCategoryIdParamDto {
  @IsMongoId()
  eventCategoryId: string;
}
