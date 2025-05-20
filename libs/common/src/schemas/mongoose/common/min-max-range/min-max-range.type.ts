import { IsNumber, IsOptional, Validate } from 'class-validator';
import { IsMinLowerThanMax } from './validations/is-min-lower-than-max.class';
import { IsMinOrMaxProvided } from './validations/is-min-or-max-provided.class';

export class MinMaxRange {
  @Validate(IsMinOrMaxProvided)
  @Validate(IsMinLowerThanMax)
  min?: number;

  @Validate(IsMinOrMaxProvided)
  max?: number;
}
