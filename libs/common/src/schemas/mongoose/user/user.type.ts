import { TransformObjectId, TransformObjectIds } from '@common/decorators/class-transformer';
import { IsBirthDate } from '@common/decorators/class-validator/common';
import { BaseModel, IBaseInstanceMethods } from '@common/schemas/mongoose/base/base-schema';
import { Media } from '@common/schemas/mongoose/common/media';
import { Type } from 'class-transformer';
import {
  IsAlphanumeric,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsInstance,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { HydratedDocument, Model, Types } from 'mongoose';
import { UserAddress } from './user-address';
import { OwnedPetsSubSchemaType } from './user-subschemas/owned-pets';
import { UserDevicesSubSchemaType } from './user-subschemas/user-devices';
import { UserSettingsSubSchemaType } from './user-subschemas/user-settings';
import { BlockedReasonEnum, UserGenderEnum, UserRoleEnum, UserSocketStatusEnum } from './user.enum';

const nameRegex = /^[^\d!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]+$/;

export class User extends BaseModel<User> {
  @IsAlphanumeric()
  username: string;

  @IsString()
  @IsNotEmpty()
  @Matches(nameRegex)
  @MinLength(2)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(nameRegex)
  @MinLength(2)
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsString()
  googleId?: string;

  @IsOptional()
  @IsString()
  appleId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  profilePictureMedia?: Media;

  @IsOptional()
  @IsUUID()
  profilePictureMediaProcessingId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserGenderEnum)
  gender?: UserGenderEnum;

  @IsOptional()
  @IsBirthDate()
  birthDate?: string;

  @IsOptional()
  @IsNumber()
  birthDateTimestamp?: number;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  activeAddress?: Types.ObjectId;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsBoolean()
  isDiscoverable?: boolean;

  @IsOptional()
  @ValidateNested()
  settings?: UserSettingsSubSchemaType;

  @IsOptional()
  @IsString()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsOptional()
  @IsDate()
  blockedAt?: Date;

  @IsOptional()
  @IsString()
  @IsEnum(BlockedReasonEnum)
  blockReason?: BlockedReasonEnum;

  @IsOptional()
  @IsNumber()
  @Min(0)
  blockDuration?: number;

  @IsBoolean()
  isDoneOnboarding: boolean;

  @ValidateIf((o) => o.ownedPets?.length > 0)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => OwnedPetsSubSchemaType)
  ownedPets: OwnedPetsSubSchemaType[];

  @ValidateIf((o) => o.devices?.length > 0)
  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => UserDevicesSubSchemaType)
  devices: UserDevicesSubSchemaType[];

  @IsOptional()
  @IsNumber()
  totalPosts?: number;

  @IsOptional()
  @IsNumber()
  totalFollowers?: number;

  @IsOptional()
  @IsNumber()
  totalUserFollowings?: number;

  @IsOptional()
  @IsNumber()
  totalPetFollowings?: number;

  @IsOptional()
  @IsNumber()
  totalPets?: number;

  @IsOptional()
  @IsNumber()
  totalReports?: number;

  @IsOptional()
  @IsNumber()
  totalEventsAttended?: number;

  @IsOptional()
  @IsNumber()
  totalEventsHosted?: number;

  /* Chat related fields */
  @IsOptional()
  @IsString()
  socketId?: string;

  @IsOptional()
  @IsString()
  @IsEnum(UserSocketStatusEnum)
  socketStatus?: UserSocketStatusEnum;

  @IsOptional()
  @IsDate()
  lastSocketActiveDate?: Date;

  @IsOptional()
  @IsArray()
  @IsInstance(Types.ObjectId, { each: true })
  @TransformObjectIds()
  currentRooms?: Types.ObjectId[];

  // TODO: Remove this when address component is done
  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  country: Types.ObjectId;

  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  @ValidateIf((o) => !!o.country)
  city: Types.ObjectId;

  @IsOptional()
  @IsInstance(Types.ObjectId)
  @TransformObjectId()
  area?: Types.ObjectId;

  /* No validation fields (hooks) */
  hasUpdatedLanguage?: boolean;
  hasUpdatedLocation?: boolean;
}

export interface IUserInstanceMethods extends IBaseInstanceMethods {
  comparePassword(password: string): Promise<boolean>;
  getActiveAddress(): Promise<HydratedDocument<UserAddress>>;
  blockDoc(blockDate: Date, blockReason: BlockedReasonEnum): Promise<void>;
}
export interface IUserModel extends Model<User, Record<string, unknown>, IUserInstanceMethods> {}
