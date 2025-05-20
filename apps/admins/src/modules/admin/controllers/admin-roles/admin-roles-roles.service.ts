import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  AdminRole,
  BasePaginationQuery,
  CustomError,
  IAdminRoleModel,
  ModelNames,
  ResponsePayload,
} from '@instapets-backend/common';
import { errorManager } from '../../shared/config/errors.config';
import { CreateRoleDto } from './dto/create-role.dto';
import { RoleIdParamDto } from '../../shared/dto/role-id-param.dto';
import { UpdateRoleBodyDto } from './dto/update-role.dto';

@Injectable()
export class AdminRolesService {
  constructor(
    //@Inject(ModelNames.ADMIN) private adminModel: IAdminModel,
    @Inject(ModelNames.ADMIN_ROLE) private adminRoleModel: IAdminRoleModel,
  ) {}
  async createRole(adminId: string, { name }: CreateRoleDto) {
    if (await this.adminRoleModel.exists({ name })) {
      throw new ConflictException(errorManager.ROLE_ALREADY_EXISTS);
    }

    const newRole = new this.adminRoleModel({
      name,
    });

    const savedRole = await newRole.save();

    const role = await this.adminRoleModel.findById(savedRole._id, {
      _id: 1,
      name: 1,
    });

    return role;
  }

  async updateRole(adminId: string, { roleId }: RoleIdParamDto, body: UpdateRoleBodyDto) {
    const { name } = body;

    const oldRole = await this.adminRoleModel.findById(roleId);
    if (!oldRole) {
      throw new NotFoundException(errorManager.ROLE_NOT_FOUND);
    }

    if (name && (await this.adminRoleModel.exists({ name }))) {
      throw new ConflictException(errorManager.ROLE_ALREADY_EXISTS);
    }

    oldRole.set({
      ...body,
    });

    const savedRole = await oldRole.save();

    const role = await this.adminRoleModel.findById(savedRole._id, {
      _id: 1,
      name: 1,
    });

    return role;
  }

  async deleteRole(adminId: string, { roleId }: RoleIdParamDto) {
    const role = await this.adminRoleModel.findById(roleId);
    if (!role) {
      throw new NotFoundException(errorManager.ROLE_NOT_FOUND);
    }

    await role.deleteDoc();
  }

  async getRoles(adminId: string, { page, limit }: BasePaginationQuery): Promise<ResponsePayload<AdminRole>> {
    const [total, docs] = await Promise.all([
      this.adminRoleModel.find({}).countDocuments(),
      this.adminRoleModel
        .find({}, { _id: 1, name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return { data: docs, total, limit, page, pages: Math.ceil(total / limit) };
  }

  async getRoleById(adminId: string, { roleId }: RoleIdParamDto) {
    const role = await this.adminRoleModel
      .findById(roleId, {
        _id: 1,
        name: 1,
      })
      .lean();
    if (!role) {
      throw new NotFoundException(errorManager.ROLE_NOT_FOUND);
    }

    return role;
  }
}
