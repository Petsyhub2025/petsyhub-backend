import { IsMongoId } from 'class-validator';

export class OrderIdParamDto {
  @IsMongoId()
  orderId: string;
}
