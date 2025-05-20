import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Schema } from 'mongoose';
import { IBaseLikeModel, LikeType } from '../base-like';
import { CommentReplyLikeEventsEnum } from './comment-reply-like.enum';
import { CommentReplyLike, ICommentReplyLikeInstanceMethods, ICommentReplyLikeModel } from './comment-reply-like.type';

const CommentReplyLikeSchema = new Schema<CommentReplyLike, ICommentReplyLikeModel, ICommentReplyLikeInstanceMethods>(
  {
    commentReply: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COMMENT_REPLY,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function commentReplyLikeSchemaFactory(baseLikeModel: IBaseLikeModel, eventEmitter: EventEmitter2) {
  CommentReplyLikeSchema.pre('validate', async function () {
    await validateSchema(this, CommentReplyLike);
  });

  CommentReplyLikeSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(CommentReplyLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, this);
  });

  CommentReplyLikeSchema.methods.deleteDoc = async function (this: HydratedDocument<CommentReplyLike>) {
    await this.deleteOne();

    eventEmitter.emit(CommentReplyLikeEventsEnum.DELETE_DOC, this);
  };

  const commentReplyLikeModel = baseLikeModel.discriminator(
    ModelNames.COMMENT_REPLY_LIKE,
    CommentReplyLikeSchema,
    LikeType.COMMENT_REPLY,
  );

  return commentReplyLikeModel;
}
