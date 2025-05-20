import { Body, Controller, Delete, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GroupsService } from './groups.service';
import { globalControllerVersioning } from '@chat/shared-module/constants';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { GroupChatParamDto } from '@chat/user/shared/dto/group-chat.dto';
import { removeParticipantQueryDto } from './dto/remove-participant.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@Controller({
  path: 'groups',
  ...globalControllerVersioning,
})
@ApiTags('user')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @ApiBearerAuth()
  @Post()
  async createGroup(@Persona() userJWT: UserJwtPersona, @Body() body: CreateGroupDto) {
    const groupData = await this.groupsService.createGroup(userJWT._id, body);

    return new CustomResponse().success({
      payload: { data: groupData },
    });
  }

  @ApiBearerAuth()
  @Patch(':groupChatRoomId/add-participant')
  async addParticipants(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: GroupChatParamDto,
    @Body() body: AddParticipantDto,
  ) {
    await this.groupsService.addParticipants(userJWT._id, param, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Patch(':groupChatRoomId/remove-participant')
  async removeParticipant(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: GroupChatParamDto,
    @Query() query: removeParticipantQueryDto,
  ) {
    await this.groupsService.removeParticipant(userJWT._id, param, query);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Patch(':groupChatRoomId/leave-group')
  async leaveGroup(@Persona() userJWT: UserJwtPersona, @Param() param: GroupChatParamDto) {
    await this.groupsService.leaveGroup(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Patch(':groupChatRoomId/update-group')
  async updateGroup(
    @Persona() userJWT: UserJwtPersona,
    @Param() param: GroupChatParamDto,
    @Body() body: UpdateGroupDto,
  ) {
    const group = await this.groupsService.updateGroup(userJWT._id, param, body);

    return new CustomResponse().success({ payload: { data: group } });
  }

  @ApiBearerAuth()
  @Delete(':groupChatRoomId')
  async deleteGroup(@Persona() userJWT: UserJwtPersona, @Param() param: GroupChatParamDto) {
    await this.groupsService.deleteGroup(userJWT._id, param);

    return new CustomResponse().success({});
  }
}
