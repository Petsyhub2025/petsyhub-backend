import { ModelNames } from '@common/constants';
import { validateSchema } from '@common/helpers/mongoose-schema-validation.helper';
import { HydratedDocument, Schema } from 'mongoose';
import { ChatRoomType, IBaseChatRoomModel } from '../base-chat-room';
import { GroupChatRoom, IGroupChatRoomInstanceMethods, IGroupChatRoomModel } from './group-chat-room.type';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GroupChatEventsEnum } from './group-chat.enum';
import { MediaSchema } from '@common/schemas/mongoose/common/media';

const GroupChatRoomSchema = new Schema<GroupChatRoom, IGroupChatRoomModel, IGroupChatRoomInstanceMethods>(
  {
    name: {
      type: String,
      required: false,
    },

    roomPictureMedia: {
      type: MediaSchema,
      required: false,
    },

    roomPictureMediaProcessingId: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

export function groupChatRoomSchemaFactory(baseChatRoomModel: IBaseChatRoomModel, eventEmitter: EventEmitter2) {
  GroupChatRoomSchema.pre('validate', async function () {
    await validateSchema(this, GroupChatRoom);
  });

  GroupChatRoomSchema.methods.deleteDoc = async function (this: HydratedDocument<GroupChatRoom>) {
    this.deletedAt = new Date();
    await this.save();

    eventEmitter.emit(GroupChatEventsEnum.DELETE_DOC, this);
  };

  const GroupChatRoomModel = baseChatRoomModel.discriminator(
    ModelNames.GROUP_CHAT_ROOM,
    GroupChatRoomSchema,
    ChatRoomType.GROUP,
  );

  return GroupChatRoomModel;
}
