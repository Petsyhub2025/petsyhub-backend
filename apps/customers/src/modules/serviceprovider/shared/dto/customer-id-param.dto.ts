import { IsMongoId } from 'class-validator';

export class CustomerIdParamDto {
  @IsMongoId()
  customerId: string;
}
