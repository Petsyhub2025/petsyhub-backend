import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';
import { ChatMessage, IChatMessageInstanceMethods, IChatMessageModel } from './chat-message.type';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const ChatMessageSchema = new Schema<ChatMessage, IChatMessageModel, IChatMessageInstanceMethods>(
  {
    room: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.BASE_CHAT_ROOM,
    },

    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: ModelNames.USER,
    },

    body: {
      type: String,
      required: false,
      maxlength: 2000,
    },

    media: {
      type: [MediaSchema],
      required: false,
    },

    mediaProcessingId: {
      type: String,
      required: false,
    },

    isSent: {
      type: Boolean,
      default: false,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },

    ...BaseSchema,
  },
  {
    timestamps: true,
  },
);

export function chatMessageSchemaFactory(connection: Connection) {
  ChatMessageSchema.index({ mediaProcessingId: 1 });

  ChatMessageSchema.pre('validate', async function () {
    await validateSchema(this, ChatMessage);
  });

  ChatMessageSchema.methods.deleteDoc = async function (this: HydratedDocument<ChatMessage>) {
    if (this.isDeleted) return;
    this.body = 'This message has been deleted';
    this.media = [];
    this.isDeleted = true;

    await this.save();
  };

  const chatMessageModel = connection.model(ModelNames.CHAT_MESSAGE, ChatMessageSchema);

  return chatMessageModel;
}
