import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { Connection, HydratedDocument, Schema } from 'mongoose';
import { BaseChatRoom, IBaseChatRoomInstanceMethods, IBaseChatRoomModel } from './base-chat-room.type';
import { BaseSchema } from '@common/schemas/mongoose/base/base-schema';

const BaseChatRoomSchema = new Schema<BaseChatRoom, IBaseChatRoomModel, IBaseChatRoomInstanceMethods>(
  {
    ...BaseSchema,
  },
  {
    discriminatorKey: 'chatRoomType',
    timestamps: true,
  },
);

export function baseChatRoomSchemaFactory(connection: Connection) {
  BaseChatRoomSchema.index({ chatRoomType: 1 });
  BaseChatRoomSchema.index({ participants: 1 });

  BaseChatRoomSchema.pre('validate', async function () {
    await validateSchema(this, BaseChatRoom);
  });

  BaseChatRoomSchema.methods.deleteDoc = async function (this: HydratedDocument<BaseChatRoom>) {
    await this.deleteOne();
  };

  const baseChatRoomModel = connection.model(ModelNames.BASE_CHAT_ROOM, BaseChatRoomSchema);

  return baseChatRoomModel;
}
