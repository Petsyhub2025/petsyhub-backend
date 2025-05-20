import { IsObject, ValidateIf, ValidateNested } from 'class-validator';
import { DeviceVersionSubSchemaType } from './version';

export class UserSegmentDeviceSubSchemaType {
  @ValidateIf((o) => !!o.android || o.ios == undefined)
  @IsObject()
  @ValidateNested()
  android?: DeviceVersionSubSchemaType;

  @ValidateIf((o) => !!o.ios || o.android == undefined)
  @IsObject()
  @ValidateNested()
  ios?: DeviceVersionSubSchemaType;
}
