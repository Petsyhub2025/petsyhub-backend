import { ClientSession, Connection, HydratedDocument, Schema } from 'mongoose';
import { ITopicInstanceMethods, ITopicModel, Topic } from './topic.type';
import { LocalizedTextSchema } from '@common/schemas/mongoose/common/localized-text';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { ModelNames } from '@common/constants';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

export const TopicSchema = new Schema<Topic, ITopicModel, ITopicInstanceMethods>(
  {
    name: {
      type: LocalizedTextSchema(),
      required: true,
    },

    icon: {
      type: MediaSchema,
      required: false,
    },

    iconProcessingId: {
      type: String,
      required: false,
    },

    creator: {
      type: Schema.Types.ObjectId,
      ref: ModelNames.ADMIN,
      required: true,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function topicSchemaFactory(connection: Connection) {
  TopicSchema.index({ 'name.en': 1 });
  TopicSchema.index({ 'name.ar': 1 });
  TopicSchema.index({ creator: 1 });
  TopicSchema.index({ isViewable: 1 });

  TopicSchema.pre('validate', function (next) {
    this.isViewable = !this.suspendedAt;
    next();
  });

  TopicSchema.pre('validate', async function () {
    await validateSchema(this, Topic);
  });

  TopicSchema.methods.suspendDoc = async function (this: HydratedDocument<Topic>) {
    this.suspendedAt = new Date();
    await this.save();
  };

  TopicSchema.methods.unSuspendDoc = async function (this: HydratedDocument<Topic>) {
    this.suspendedAt = null;
    await this.save();
  };

  const topicModel = connection.model(ModelNames.TOPIC, TopicSchema);
  return topicModel;
}
