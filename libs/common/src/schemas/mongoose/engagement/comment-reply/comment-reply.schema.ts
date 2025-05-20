import { ModelNames } from '@common/constants';
import { DeepLinkModelsEnum, UserDeepLinkModelInteractionsEnum } from '@common/enums';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { DeepLinkService, FirebaseDynamicLinkService } from '@common/helpers/services';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Schema, Connection, HydratedDocument } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { DynamicLinkSchema } from '@common/schemas/mongoose/common/dynamic-link';
import { CommentReplyEventsEnum } from './comment-reply.enum';
import { CommentReply, ICommentReplyModel, ICommentReplyInstanceMethods } from './comment-reply.type';

const CommentReplySchema = new Schema<CommentReply, ICommentReplyModel, ICommentReplyInstanceMethods>(
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

    replyOn: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COMMENT,
    },

    totalLikes: {
      type: Number,
      default: 0,
    },

    totalReports: {
      type: Number,
      default: 0,
    },

    suspendedDueToCommentSuspensionAt: {
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

export function commentReplySchemaFactory(
  connection: Connection,
  eventEmitter: EventEmitter2,
  deepLinkService: DeepLinkService,
  firebaseDynamicLinkService: FirebaseDynamicLinkService,
) {
  CommentReplySchema.index({ replyOn: 1 });
  CommentReplySchema.index({ isViewable: 1 });
  CommentReplySchema.index({ _id: -1, isViewable: 1 });
  CommentReplySchema.index({ replyOn: 1, _id: -1 });

  CommentReplySchema.pre('validate', async function () {
    const deepLink = deepLinkService.generateUserDeepLink({
      modelName: DeepLinkModelsEnum.POSTS,
      modelId: this.post.toString(),
      modelInteractions: [
        {
          interaction: UserDeepLinkModelInteractionsEnum.COMMENTS,
          interactionId: this.replyOn.toString(),
        },
        {
          interaction: UserDeepLinkModelInteractionsEnum.REPLIES,
          interactionId: this._id.toString(),
        },
      ],
    });

    const dynamicLink = await firebaseDynamicLinkService.generateFirebaseDynamicLink<CommentReply>(this, ['body'], {
      link: deepLink,
      title: 'Petsy',
      description: this.body,
    });

    this.dynamicLink = dynamicLink;
  });

  CommentReplySchema.pre('validate', function (next) {
    this.isViewable =
      !this.deletedAt &&
      !this.suspendedAt &&
      !this.suspendedDueToUserSuspensionAt &&
      !this.suspendedDueToCommentSuspensionAt;
    next();
  });

  CommentReplySchema.pre('validate', async function () {
    await validateSchema(this, CommentReply);
  });

  CommentReplySchema.pre('save', async function () {
    this.wasNew = this.isNew;
  });

  CommentReplySchema.post('save', async function () {
    if (!this.wasNew) return;

    eventEmitter.emit(CommentReplyEventsEnum.POST_SAVE_UPDATE_COMMENT_COUNTS, this);
  });

  CommentReplySchema.methods.deleteDoc = async function (this: HydratedDocument<CommentReply>) {
    this.deletedAt = new Date();
    await this.save();

    eventEmitter.emit(CommentReplyEventsEnum.DELETE_DOC, this);
  };

  CommentReplySchema.methods.suspendDoc = async function (this: HydratedDocument<CommentReply>) {
    this.suspendedAt = new Date();
    await this.save();
  };

  CommentReplySchema.methods.unSuspendDoc = async function (this: HydratedDocument<CommentReply>) {
    this.suspendedAt = null;
    await this.save();
  };

  CommentReplySchema.methods.suspendDocDueToCommentSuspension = async function (this: HydratedDocument<CommentReply>) {
    this.suspendedDueToCommentSuspensionAt = new Date();
    await this.save();
  };

  CommentReplySchema.methods.unSuspendDocDueToCommentSuspension = async function (
    this: HydratedDocument<CommentReply>,
  ) {
    this.suspendedDueToCommentSuspensionAt = null;
    await this.save();
  };

  CommentReplySchema.methods.suspendDocDueToUserSuspension = async function (this: HydratedDocument<CommentReply>) {
    this.suspendedDueToUserSuspensionAt = new Date();
    await this.save();
  };

  CommentReplySchema.methods.unSuspendDocDueToUserSuspension = async function (this: HydratedDocument<CommentReply>) {
    this.suspendedDueToUserSuspensionAt = null;
    await this.save();
  };

  const commentReplyModel = connection.model(ModelNames.COMMENT_REPLY, CommentReplySchema);

  return commentReplyModel;
}
