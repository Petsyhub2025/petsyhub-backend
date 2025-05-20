import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '@songkeys/nestjs-redis';
import {
  Admin,
  AdminAdminRpcPayload,
  AdminFcmTopicsEnum,
  AdminPermissions,
  AdminResourcesEnum,
  AdminUpdateSubscriptionsEnum,
  AdminUpdateSubscriptionsSubSchemaType,
  CustomLoggerService,
  IAdminFCMTokenModel,
  IAdminModel,
  IAdminRoleModel,
  ISearchResponseData,
  ISubscribeAdminToTopicRpc,
  ModelNames,
  RabbitExchanges,
  RabbitRoutingKeys,
  ResponsePayload,
  RpcResponse,
  addMaintainOrderStages,
  addPaginationStages,
  adminPermissionToFcmTopicMapper,
  adminSubscriptionToFcmTopicMapper,
  adminSubscriptionToPermissionMapper,
} from '@instapets-backend/common';
import Redis from 'ioredis';
import { Types } from 'mongoose';
import { catchError, from, lastValueFrom, mergeMap, of } from 'rxjs';
import { errorManager } from '../../shared/config/errors.config';
import { AdminIdParamDto } from '../../shared/dto/admin-id-param.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { GetAdminsQueryDto } from './dto/get-admins.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateSelfProfileDto } from './dto/update-self-profile.dto';
import { getAdminsPipeline } from './helpers/admin-population.pipeline';
import { IChangedData } from './interfaces/changed-data.interface';

@Injectable()
export class AdminService {
  private readonly redis: Redis;

  constructor(
    private readonly amqpConnection: AmqpConnection,
    private readonly redisService: RedisService,
    private readonly logger: CustomLoggerService,
    @Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    @Inject(ModelNames.ADMIN_ROLE) private adminRoleModel: IAdminRoleModel,
    @Inject(ModelNames.ADMIN_FCM_TOKEN) private adminFcmTokenModel: IAdminFCMTokenModel,
  ) {
    this.redis = this.redisService.getClient();
  }

  async getAdmins(adminId: string, query: GetAdminsQueryDto): Promise<ResponsePayload<Admin>> {
    const { page, limit, search, roleId } = query;

    if (search) {
      return this.getSearchedAdmins(query);
    }
    const matchStage = [
      {
        $match: {
          ...(roleId && { 'role._id': new Types.ObjectId(roleId) }),
        },
      },
    ];

    const [[{ total = 0 } = {}], docs] = await Promise.all([
      this.adminModel.aggregate(matchStage).count('total'),
      this.adminModel.aggregate([...matchStage, ...addPaginationStages({ limit, page }), ...getAdminsPipeline()]),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  private async getSearchedAdmins({ page, limit, search, roleId }: GetAdminsQueryDto): Promise<ResponsePayload<Admin>> {
    const payload: AdminAdminRpcPayload = {
      page,
      limit,
      search,
      roleId,
    };
    const rpcResponse = await this.amqpConnection.request<RpcResponse<ISearchResponseData>>({
      exchange: RabbitExchanges.SERVICE,
      routingKey: RabbitRoutingKeys.SEARCH_RPC_ADMIN_GET_ADMINS_SEARCH_DATA,
      payload,
    });

    if (!rpcResponse.success) {
      throw new InternalServerErrorException(errorManager.SEARCH_FAILED(rpcResponse.error.message));
    }

    const searchData = rpcResponse.data;

    const _ids = searchData._ids.map((_id) => new Types.ObjectId(_id));

    const matchStage = [{ $match: { _id: { $in: _ids } } }];

    const docs = await this.adminModel.aggregate([
      ...matchStage,
      ...addMaintainOrderStages({ input: _ids }),
      ...getAdminsPipeline(),
    ]);

    return {
      data: docs,
      total: searchData.total,
      limit: searchData.limit,
      page: searchData.page,
      pages: searchData.pages,
    };
  }

  async getAdminById(adminId: string, { adminId: selectedAdminId }: AdminIdParamDto) {
    const admin = await this.adminModel
      .findById(selectedAdminId, {
        _id: 1,
        firstName: 1,
        lastName: 1,
        email: 1,
        role: 1,
        permissions: 1,
        settings: 1,
      })
      .lean();
    if (!admin) {
      throw new NotFoundException(errorManager.ADMIN_NOT_FOUND);
    }

    return admin;
  }

  async createAdmin({ email, firstName, lastName, permissions, roleId }: CreateAdminDto) {
    if (await this.adminModel.exists({ email })) {
      throw new ConflictException(errorManager.ADMIN_EMAIL_EXISTS);
    }
    const adminRole = await this.adminRoleModel
      .findById(roleId, {
        _id: 1,
        name: 1,
      })
      .lean();
    if (!adminRole) {
      throw new NotFoundException(errorManager.ADMIN_ROLE_NOT_FOUND);
    }
    const newAdmin = new this.adminModel({
      email,
      firstName,
      lastName,
      permissions,
      role: adminRole,
    });

    await newAdmin.save();

    return newAdmin;
  }

  async updateAdmin({ adminId }: AdminIdParamDto, body: UpdateAdminDto) {
    const { roleId } = body;

    const [admin, adminRole] = await Promise.all([
      this.adminModel.findById(adminId),
      this.adminRoleModel.findById(roleId, { _id: 1, name: 1 }).lean(),
    ]);

    if (!admin) {
      throw new NotFoundException(errorManager.ADMIN_NOT_FOUND);
    }

    if (roleId && !adminRole) {
      throw new NotFoundException(errorManager.ADMIN_ROLE_NOT_FOUND);
    }

    // Holding the old permissions to compare with the new ones after the save is complete
    const oldPermissions = admin.toJSON().permissions;

    admin.set({ ...body, ...(roleId && { role: adminRole }) });
    const newAdmin = await admin.save();

    const { permissions } = body;

    if (permissions) {
      const revokedAdminPermissions = await this.removeRevokedAdminReadPermissionSubscriptions(
        admin._id.toString(),
        oldPermissions,
        permissions,
      );
      const modifiedSubscriptions =
        this.mapRevokedAdminReadPermissionsToSubscriptionsUpdateQuery(revokedAdminPermissions);

      if (Object.keys(modifiedSubscriptions).length) {
        await this.adminModel.findOneAndUpdate({ _id: admin._id }, { $set: modifiedSubscriptions });
      }
    }

    return newAdmin;
  }

  async updateSelfProfile(adminId: string, body: UpdateSelfProfileDto) {
    const admin = await this.adminModel.findById(adminId);

    if (!admin) {
      throw new NotFoundException(errorManager.ADMIN_NOT_FOUND);
    }

    // Holding the old subscriptions to compare with the new ones after the save is complete
    const oldSubscriptions = admin.toJSON().settings?.updateSubscriptions;

    admin.set(body);
    await admin.save();

    const { settings } = body;

    if (settings) {
      const { updateSubscriptions } = settings;
      await this.adjustAdminTopicSubscriptions(admin, oldSubscriptions, updateSubscriptions);
    }

    return this.adminModel.findById(adminId, {
      _id: 1,
      firstName: 1,
      lastName: 1,
      email: 1,
      role: 1,
      permissions: 1,
      settings: 1,
    });
  }

  async deleteAdmin(adminId: string, { adminId: paramAdminId }: AdminIdParamDto) {
    if (adminId.toString() === paramAdminId.toString()) {
      throw new ConflictException(errorManager.ADMIN_CANNOT_DELETE_SELF);
    }

    const admin = await this.adminModel.findById(paramAdminId);

    if (!admin) {
      throw new NotFoundException(errorManager.ADMIN_NOT_FOUND);
    }

    const AdminPermissions = admin.permissions.admins;

    if (AdminPermissions.create || AdminPermissions.update || AdminPermissions.delete || AdminPermissions.read) {
      throw new UnauthorizedException(errorManager.ADMIN_CANNOT_DELETE_ADMIN_WITH_ADMIN_PERMISSIONS);
    }

    await this.removeAdminSession(paramAdminId);
    await admin.deleteDoc();
  }

  private async removeAdminSession(adminId: string) {
    await this.redis.del(adminId.toString());
  }

  private async removeRevokedAdminReadPermissionSubscriptions(
    adminId: string,
    oldPermissions: AdminPermissions,
    newPermissions: AdminPermissions,
  ) {
    const _adminFcmTokens = await this.adminFcmTokenModel.find({ admin: adminId }, { fcmToken: 1 }).lean();
    if (!_adminFcmTokens.length) return;

    const adminFcmTokens = _adminFcmTokens.map(({ fcmToken }) => fcmToken);

    const revokedAdminReadPermissions = this.getRevokedAdminReadPermissions(oldPermissions, newPermissions);

    const topicsToUnsubscribe = [];

    for (const permission in revokedAdminReadPermissions) {
      const topicFromPermission = adminPermissionToFcmTopicMapper(permission as AdminResourcesEnum);

      if (!topicFromPermission) continue;

      const { oldValue, newValue } = revokedAdminReadPermissions[permission];

      if (oldValue && !newValue) {
        topicsToUnsubscribe.push(topicFromPermission);
      }
    }

    await Promise.all([
      lastValueFrom(
        from(adminFcmTokens).pipe(
          mergeMap((fcmToken) =>
            this.adminFcmTokenModel.findOneAndUpdate(
              { fcmToken },
              { $pull: { topics: { $in: topicsToUnsubscribe } } },
              { new: true },
            ),
          ),
          catchError((error) => {
            this.logger.error('Failed to fully remove admin fcm subscriptions during permission update.', {
              error,
              adminFcmTokens,
              adminId,
              topicsToUnsubscribe,
            });
            return of(null);
          }),
        ),
      ),
      this.sendAdminUnsubscribeFromTopicRpc(adminId, topicsToUnsubscribe, adminFcmTokens),
    ]);

    return revokedAdminReadPermissions;
  }

  private async adjustAdminTopicSubscriptions(
    admin: Hydrate<Admin>,
    oldSubscriptions: AdminUpdateSubscriptionsSubSchemaType,
    newSubscriptions: AdminUpdateSubscriptionsSubSchemaType,
  ) {
    const _adminFcmTokens = await this.adminFcmTokenModel.find({ admin: admin._id }, { fcmToken: 1 }).lean();
    if (!_adminFcmTokens.length) return;

    const adminFcmTokens = _adminFcmTokens.map(({ fcmToken }) => fcmToken);
    const changedSubscriptions = this.getChangedSubscriptions(oldSubscriptions, newSubscriptions);
    const topicsToSubscribe = [];
    const topicsToUnsubscribe = [];

    for (const subscription in changedSubscriptions) {
      const topicFromSubscription = adminSubscriptionToFcmTopicMapper(subscription as AdminUpdateSubscriptionsEnum);

      if (!topicFromSubscription) continue;

      const { oldValue, newValue } = changedSubscriptions[subscription];

      if (oldValue && !newValue) {
        topicsToUnsubscribe.push(topicFromSubscription);
      } else if (!oldValue && newValue) {
        const hasPermissionToSubscribe =
          admin.permissions[adminSubscriptionToPermissionMapper(subscription as AdminUpdateSubscriptionsEnum)]?.read;

        if (!hasPermissionToSubscribe) {
          throw new ForbiddenException(errorManager.ADMIN_DOES_NOT_HAVE_PERMISSION_TO_SUBSCRIBE_TO_TOPIC);
        }

        topicsToSubscribe.push(topicFromSubscription);
      }
    }

    await Promise.all([
      this.sendAdminSubscribeFromTopicRpc(admin._id.toString(), topicsToSubscribe, adminFcmTokens),
      this.sendAdminUnsubscribeFromTopicRpc(admin._id.toString(), topicsToUnsubscribe, adminFcmTokens),
    ]);
  }

  private getChangedSubscriptions(
    oldSubscriptions: AdminUpdateSubscriptionsSubSchemaType,
    newSubscriptions: AdminUpdateSubscriptionsSubSchemaType,
  ) {
    const changedSubscriptions: { [key: string]: IChangedData } = {};

    for (const key in newSubscriptions) {
      if (newSubscriptions[key] !== oldSubscriptions[key]) {
        changedSubscriptions[key] = {
          oldValue: oldSubscriptions[key],
          newValue: newSubscriptions[key],
        };
      }
    }

    return changedSubscriptions;
  }

  private getRevokedAdminReadPermissions(oldPermissions: AdminPermissions, newPermissions: AdminPermissions) {
    const revokedAdminPermissions: { [key: string]: IChangedData } = {};

    for (const key in newPermissions) {
      if (newPermissions[key]?.read !== oldPermissions[key]?.read) {
        revokedAdminPermissions[key] = {
          oldValue: oldPermissions[key]?.read,
          newValue: newPermissions[key]?.read,
        };
      }
    }

    return revokedAdminPermissions;
  }

  private async sendAdminSubscribeFromTopicRpc(
    adminId: string,
    topicsToSubscribe: AdminFcmTopicsEnum[],
    adminFcmTokens: string[],
  ) {
    if (!topicsToSubscribe?.length) return;

    return lastValueFrom(
      from(topicsToSubscribe).pipe(
        mergeMap((topic) =>
          from(
            this.amqpConnection.request({
              exchange: RabbitExchanges.SERVICE,
              routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_ADMIN_SUBSCRIBE_TO_TOPIC,
              payload: {
                topic,
                fcmTokens: adminFcmTokens,
              } as ISubscribeAdminToTopicRpc,
            }),
          ).pipe(
            catchError((error) => {
              this.logger.error('Failed to subscribe admin to topic fully', {
                error,
                adminFcmTokens,
                adminId,
                topic,
              });
              return of(null);
            }),
          ),
        ),
      ),
    );
  }

  private async sendAdminUnsubscribeFromTopicRpc(
    adminId: string,
    topicsToUnsubscribe: AdminFcmTopicsEnum[],
    adminFcmTokens: string[],
  ) {
    if (!topicsToUnsubscribe?.length) return;

    return lastValueFrom(
      from(topicsToUnsubscribe).pipe(
        mergeMap((topic) =>
          from(
            this.amqpConnection.request({
              exchange: RabbitExchanges.SERVICE,
              routingKey: RabbitRoutingKeys.NOTIFICATION_RPC_ADMIN_UNSUBSCRIBE_FROM_TOPIC,
              payload: {
                topic,
                fcmTokens: adminFcmTokens,
              } as ISubscribeAdminToTopicRpc,
            }),
          ).pipe(
            catchError((error) => {
              this.logger.error('Failed to unsubscribe admin from topic fully', {
                error,
                adminFcmTokens,
                adminId,
                topic,
              });
              return of(null);
            }),
          ),
        ),
      ),
    );
  }

  private mapRevokedAdminReadPermissionsToSubscriptionsUpdateQuery(revokedAdminReadPermissions: {
    [key: string]: IChangedData;
  }) {
    const mapper = {
      [AdminResourcesEnum.APPOINTMENTS]: AdminUpdateSubscriptionsEnum.APPOINTMENT_UPDATES,
    };

    const modifiedSubscriptions = {};

    for (const permission in revokedAdminReadPermissions) {
      const subscriptionFromPermission = mapper[permission];

      if (!subscriptionFromPermission) continue;

      const { oldValue, newValue } = revokedAdminReadPermissions[permission];

      if (oldValue && !newValue) {
        modifiedSubscriptions[`settings.updateSubscriptions.${subscriptionFromPermission}`] = false;
      }
    }

    return modifiedSubscriptions;
  }
}
