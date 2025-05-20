import { ModelNames } from '@common/constants';
import { UserDeepLinkModelInteractionsEnum, DeepLinkModelsEnum } from '@common/enums';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { CommentEventsEnum } from './comment.enum';
import { Comment, ICommentInstanceMethods, ICommentModel } from './comment.type';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';

const CommentSchema = new Schema<Comment, ICommentModel, ICommentInstanceMethods>(
  {
    authorUser: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    post: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.POST,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    totalLikes: {
      type: Number,
      default: 0,
    },

    totalReplies: {
      type: Number,
      default: 0,
    },

    totalReports: {
      type: Number,
      default: 0,
    },

    suspendedDueToPostSuspensionAt: {
      type: Date,
      default: null,
    },

    ...DynamicLinkSchema,
    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function commentSchemaFactory(
  connection: Connection,
  eventEmitter: EventEmitter2,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  CommentSchema.index({ isViewable: 1 });
  CommentSchema.index({ _id: -1, isViewable: 1 });
  CommentSchema.index({ post: 1, _id: -1 });

  CommentSchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.POSTS,
      modelId: this.post.toString(),
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: this._id.toString(),
        },
      ],
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<Comment>(this, ['body'], {
      link: deepLink,
      title: 'Petsy',
      description: this.body,
    });

    this.dynamicLink = dynamicLink;
  });

  CommentSchema.pre('validate', function (next) {
    this.isViewable =
      !this.deletedAt &&
      !this.suspendedAt &&
      !this.suspendedDueToUserSuspensionAt &&
      !this.suspendedDueToPostSuspensionAt;
    next();
  });

  CommentSchema.pre('validate', async function () {
    await validateSchema(this, Comment);
  });

  CommentSchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  CommentSchema.post('save', async function () {
    if (!this.wasNew) return;

    eventEmitter.emit(CommentEventsEnum.POST_SAVE_UPDATE_POST_COUNTS, this);
  });

  CommentSchema.methods.deleteDoc = async function (this: HydratedDocument<Comment>) {
    this.deletedAt = new Date();
    await this.save();

    eventEmitter.emit(CommentEventsEnum.DELETE_DOC, this);
  };

  CommentSchema.methods.suspendDoc = async function (this: HydratedDocument<Comment>) {
    this.suspendedAt = new Date();
    await this.save();

    eventEmitter.emit(CommentEventsEnum.SUSPEND_DOC, this);
  };

  CommentSchema.methods.unSuspendDoc = async function (this: HydratedDocument<Comment>) {
    this.suspendedAt = null;
    await this.save();

    eventEmitter.emit(CommentEventsEnum.UN_SUSPEND_DOC, this);
  };

  CommentSchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<Comment>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();
  };

  CommentSchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<Comment>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();
  };

  CommentSchema.methods.suspendDocDueToPostSuspensionAt = async function (this: HydratedDocument<Comment>) {
    this.suspendedDueToPostSuspensionAt = new Date();
    await this.save();
  };

  CommentSchema.methods.unSuspendDocDueToPostSuspensionAt = async function (this: HydratedDocument<Comment>) {
    this.suspendedDueToPostSuspensionAt = null;
    await this.save();
  };

  const commentModel = connection.model(ModelNames.COMMENT, CommentSchema);

  return commentModel;
}
