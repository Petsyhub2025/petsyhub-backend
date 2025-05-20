import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HydratedDocument, Schema } from 'mongoose';
import { IBaseLikeModel, LikeType } from '../base-like';
import { PostLikeEventsEnum } from './post-like.enum';
import { IPostLikeInstanceMethods, IPostLikeModel, PostLike } from './post-like.type';

const PostLikeSchema = new Schema<PostLike, IPostLikeModel, IPostLikeInstanceMethods>(
  {
    post: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.POST,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export function postLikeSchemaFactory(baseLikeModel: IBaseLikeModel, eventEmitter: EventEmitter2) {
  PostLikeSchema.pre('validate', async function () {
    await validateSchema(this, PostLike);
  });

  PostLikeSchema.post('save', async function () {
    if (!this.authorUser) return;

    eventEmitter.emit(PostLikeEventsEnum.POST_SAVE_UPDATE_LIKE_COUNTS, this);
  });

  PostLikeSchema.methods.deleteDoc = async function (this: HydratedDocument<PostLike>) {
    await this.deleteOne();

    eventEmitter.emit(PostLikeEventsEnum.DELETE_DOC, this);
  };

  const postLikeModel = baseLikeModel.discriminator(ModelNames.POST_LIKE, PostLikeSchema, LikeType.POST);

  return postLikeModel;
}
