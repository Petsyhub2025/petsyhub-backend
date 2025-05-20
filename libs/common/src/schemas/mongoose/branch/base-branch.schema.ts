import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseBranch, IBaseBranchModel, IBaseBranchInstanceMethods } from './base-branch.type';
import { BranchEventsEnum, BranchStatusEnum } from './base-branch.enum';
import EventEmitter2 from 'eventemitter2';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { PointLocationSchema } from '@common/schemas/mongoose/common/point';
import { MediaSchema } from '@common/schemas/mongoose/common/media';
import { ScheduleSubSchema } from './subschemas/schedule';

export const BaseBranchSchema = new Schema<BaseBranch, IBaseBranchModel, IBaseBranchInstanceMethods>(
  {
    email: { type: String, required: true },
    name: { type: String, required: true },
    country: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COUNTRY,
      required: true,
    },
    city: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.CITY,
      required: function (this: HydratedDocument<BaseBranch>) {
        return !!this.country;
      },
    },
    area: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.AREA,
      required: false,
    },
    location: { type: PointLocationSchema, required: true, index: '2dsphere' },
    streetAddress: { type: String, required: true },
    postalCode: { type: Number, required: false },
    brand: { type: Schema.Types.ObjectId, ref: ModelNames.BRAND, required: true },
    documents: { type: [MediaSchema], required: false },
    mediaProcessingId: { type: String, required: false },
    status: {
      type: String,
      enum: BranchStatusEnum,
      default: BranchStatusEnum.PENDING_ADMIN_APPROVAL,
    },
    rejectionReason: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    additionalPhoneNumber: {
      type: String,
      required: false,
    },
    schedule: { type: [ScheduleSubSchema], required: true },

    rejectedAt: {
      type: Date,
      default: null,
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    rating: {
      type: Number,
      default: 0,
    },

    totalRatings: {
      type: Number,
      default: 0,
    },

    ...BaseSchema,
  },

  {
    discriminatorKey: 'branchType',
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
      },
    },
  },
);

export function baseBranchSchemaFactory(connection: Connection, eventEmitter: EventEmitter2) {
  BaseBranchSchema.index({ status: 1 });
  BaseBranchSchema.index({ country: 1 });
  BaseBranchSchema.index({ area: 1 });
  BaseBranchSchema.index({ city: 1 });
  BaseBranchSchema.index({ country: 1, city: 1, area: 1 });
  BaseBranchSchema.index({ _id: 1, status: 1 });
  BaseBranchSchema.index({ brand: 1, status: 1 });
  BaseBranchSchema.index({ brand: 1, status: 1, city: 1 });
  BaseBranchSchema.index({ branchType: 1 });
  BaseBranchSchema.index({ brand: 1 });

  BaseBranchSchema.pre('validate', async function () {
    await validateSchema(this, BaseBranch);
  });

  BaseBranchSchema.methods.deleteDoc = async function (this: HydratedDocument<BaseBranch>) {
    // await this.deleteOne();
  };

  BaseBranchSchema.methods.approveDoc = async function (this: HydratedDocument<BaseBranch>) {
    this.status = BranchStatusEnum.APPROVED;
    this.approvedAt = new Date();

    await this.save();

    eventEmitter.emit(BranchEventsEnum.BRANCH_APPROVED, this);
  };

  BaseBranchSchema.methods.suspendDoc = async function (this: HydratedDocument<BaseBranch>) {
    this.suspendedAt = new Date();
    this.status = BranchStatusEnum.SUSPENDED;
    await this.save();

    eventEmitter.emit(BranchEventsEnum.BRANCH_SUSPEND, this);
  };

  BaseBranchSchema.methods.unSuspendDoc = async function (this: HydratedDocument<BaseBranch>) {
    this.suspendedAt = null;
    this.status = BranchStatusEnum.APPROVED;
    await this.save();

    //TODO: Add event listener
    eventEmitter.emit(BranchEventsEnum.BRANCH_UNSUSPEND, this);
  };

  BaseBranchSchema.methods.rejectDoc = async function (this: HydratedDocument<BaseBranch>, rejectionReason: string) {
    this.status = BranchStatusEnum.REJECTED;
    this.rejectionReason = rejectionReason;
    this.rejectedAt = new Date();

    await this.save();
  };

  const baseBranchModel = connection.model(ModelNames.BASE_BRANCH, BaseBranchSchema);
  return baseBranchModel;
}
