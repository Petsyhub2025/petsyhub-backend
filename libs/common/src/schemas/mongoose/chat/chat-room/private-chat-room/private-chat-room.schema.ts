import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { ChatRoomType, IBaseChatRoomModel } from '../base-chat-room';
import { IPrivateChatRoomInstanceMethods, IPrivateChatRoomModel, PrivateChatRoom } from './private-chat-room.type';
import { PrivateChatEventsEnum } from './private-chat.enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

const PrivateChatRoomSchema = new Schema<PrivateChatRoom, IPrivateChatRoomModel, IPrivateChatRoomInstanceMethods>(
  {
    participants: {
      type: [Schema.Types.ObjectId],
      required: true,
      ref: ModelNames.USER,
    },
  },
  {
    timestamps: true,
  },
);

export function privateChatRoomSchemaFactory(baseChatRoomModel: IBaseChatRoomModel, eventEmitter: EventEmitter2) {
  PrivateChatRoomSchema.pre('validate', async function () {
    await validateSchema(this, PrivateChatRoom);
  });

  PrivateChatRoomSchema.methods.deleteDoc = async function (this: HydratedDocument<PrivateChatRoom>) {
    await this.deleteOne();

    eventEmitter.emit(PrivateChatEventsEnum.DELETE_DOC, this);
  };

  const PrivateChatRoomModel = baseChatRoomModel.discriminator(
    ModelNames.PRIVATE_CHAT_ROOM,
    PrivateChatRoomSchema,
    ChatRoomType.PRIVATE,
  );

  return PrivateChatRoomModel;
}
