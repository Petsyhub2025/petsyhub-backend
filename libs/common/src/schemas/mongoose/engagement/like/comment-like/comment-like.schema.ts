import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Schema } from 'mongoose';
import { IBaseLikeModel, LikeType } from '../base-like';
import { CommentLikeEventsEnum } from './comment-like.enum';
import { CommentLike, ICommentLikeInstanceMethods, ICommentLikeModel } from './comment-like.type';

const CommentLikeSchema = new Schema<CommentLike, ICommentLikeModel, ICommentLikeInstanceMethods>(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.COMMENT,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function commentLikeSchemaFactory(baseLikeModel: IBaseLikeModel, eventEmitter: EventEmitter2) {
  CommentLikeSchema.pre('validate', async function () {
    await validateSchema(this, CommentLike);
  });

  CommentLikeSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(CommentLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, this);
  });

  CommentLikeSchema.methods.deleteDoc = async function (this: HydratedDocument<CommentLike>) {
    await this.deleteOne();

    eventEmitter.emit(CommentLikeEventsEnum.DELETE_DOC, this);
  };

  const commentLikeModel = baseLikeModel.discriminator(ModelNames.COMMENT_LIKE, CommentLikeSchema, LikeType.COMMENT);

  return commentLikeModel;
}
