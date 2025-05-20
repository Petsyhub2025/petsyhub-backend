import { OmitType } from '@nestjs/swagger';
import { CreateUserSegmentDto } from './create-user-segment.dto';

export class CalculateUserCountDto extends OmitType(CreateUserSegmentDto, ['title', 'description'] as const) {}
