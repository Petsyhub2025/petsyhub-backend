import { Body, Controller, Delete, Get, Param, Patch, Post, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AdminJwtPersona,
  AdminPermission,
  AdminResourceOperationsEnum,
  AdminResourcesEnum,
  CustomResponse,
  Persona,
} from '@instapets-backend/common';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { TopicIdParamDto } from './dto/topic-id-param.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

@Controller({ path: 'topics', version: VERSION_NEUTRAL })
@ApiTags('admin')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.READ })
  async getTopics(@Persona() adminJWT: AdminJwtPersona) {
    const topics = await this.topicsService.getTopics(adminJWT._id);
    return new CustomResponse().success({
      payload: { data: topics },
    });
  }

  @Post()
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.CREATE })
  async createTopic(@Persona() adminJWT: AdminJwtPersona, @Body() body: CreateTopicDto) {
    const topic = await this.topicsService.createTopic(adminJWT._id, body);

    return new CustomResponse().success({
      payload: { data: topic },
    });
  }

  @Get(':topicId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.READ })
  async getTopicById(@Persona() adminJWT: AdminJwtPersona, @Param() param: TopicIdParamDto) {
    const topic = await this.topicsService.getTopicById(adminJWT._id, param);
    return new CustomResponse().success({
      payload: {
        data: topic,
      },
    });
  }

  @Patch(':topicId')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.UPDATE })
  async updateTopic(
    @Persona() adminJWT: AdminJwtPersona,
    @Param() param: TopicIdParamDto,
    @Body() body: UpdateTopicDto,
  ) {
    const topic = await this.topicsService.updateTopic(adminJWT._id, param, body);

    return new CustomResponse().success({
      payload: { data: topic },
    });
  }

  @Patch(':topicId/suspend')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.UPDATE })
  async suspendTopic(@Persona() adminJWT: AdminJwtPersona, @Param() param: TopicIdParamDto) {
    await this.topicsService.suspendTopic(adminJWT._id, param);

    return new CustomResponse().success({});
  }

  @Patch(':topicId/unsuspend')
  @ApiBearerAuth()
  @AdminPermission({ resource: AdminResourcesEnum.TOPICS, operation: AdminResourceOperationsEnum.UPDATE })
  async unSuspendTopic(@Persona() adminJWT: AdminJwtPersona, @Param() param: TopicIdParamDto) {
    await this.topicsService.unSuspendTopic(adminJWT._id, param);

    return new CustomResponse().success({});
  }
}
