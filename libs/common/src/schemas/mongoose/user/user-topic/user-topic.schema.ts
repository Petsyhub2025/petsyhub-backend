import { Connection, HydratedDocument, Schema } from 'mongoose';
import { IUserTopicInstanceMethods, IUserTopicModel, UserTopic } from './user-topic.type';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';

export const UserTopicSchema = new Schema<UserTopic, IUserTopicModel, IUserTopicInstanceMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.USER,
      required: true,
    },

    topic: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.TOPIC,
      required: true,
    },
    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function userTopicSchemaFactory(connection: Connection) {
  UserTopicSchema.index({ user: 1 });
  UserTopicSchema.index({ topic: 1 });
  UserTopicSchema.index({ topic: 1, user: 1 });

  UserTopicSchema.pre('validate', async function () {
    await validateSchema(this, UserTopic);
  });

  //TODO: Handled delete user topic propagation
  UserTopicSchema.methods.deleteDoc = async function (this: HydratedDocument<UserTopic>) {
    // await this.deleteOne();
  };

  const userTopicModel = connection.model(ModelNames.USER_TOPIC, UserTopicSchema);

  return userTopicModel;
}
