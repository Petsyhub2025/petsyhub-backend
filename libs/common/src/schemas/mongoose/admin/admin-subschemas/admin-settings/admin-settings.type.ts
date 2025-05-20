import { IsBoolean, IsObject, IsOptional, ValidateNested } from 'class-validator';
import { AdminUpdateSubscriptionsEnum } from './admin-settings.enum';

export class AdminUpdateSubscriptionsSubSchemaType implements Record<AdminUpdateSubscriptionsEnum, boolean> {
  @IsBoolean()
  appointmentUpdates: boolean;
}

export class AdminSettingsSubSchemaType {
  @IsOptional()
  @IsObject()
  @ValidateNested()
  updateSubscriptions: AdminUpdateSubscriptionsSubSchemaType;
}
