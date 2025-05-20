import { Schema, SchemaDefinition, SchemaDefinitionType } from 'mongoose';
import { AdminPermissionOperations, AdminResourceOperationsEnum } from './admin-operations.type';
import { AdminResourcesEnum } from './admin-resources.enum';
import { AdminPermissions } from './admin-permissions.type';

export const AdminPermissionOperationSchema = new Schema<AdminPermissionOperations>(
  {
    ...(() => {
      const obj: SchemaDefinition<SchemaDefinitionType<AdminPermissionOperations>> = Object.create({});
      Object.values(AdminResourceOperationsEnum).forEach((operation) => {
        obj[operation] = { type: Boolean, required: false };
      });
      return obj;
    })(),
  },
  { _id: false },
);

export const AdminPermissionSchema = new Schema<AdminPermissions>(
  {
    [AdminResourcesEnum.ADMINS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.ADMIN_ROLES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.APP_VERSIONS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.USERS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.PETS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.PET_BREEDS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.PET_TYPES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.POSTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.COMMENTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.MODERATION_REPORTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.CITIES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.COUNTRIES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.AREAS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.SYNC]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.BRANCH_SERVICE_TYPE]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.SERVICE_PROVIDERS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.APPOINTMENTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.EVENT_CATEGORIES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.EVENT_FACILITIES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.MARKETING]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.LOST_FOUND_POSTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.TOPICS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.BRANDS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.BRANCHES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.MEDICAL_SPECIALTY]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.BRANCH_ACCESS_ROLE]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.PRODUCTS]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
    [AdminResourcesEnum.PRODUCT_CATEGORIES]: {
      type: AdminPermissionOperationSchema,
      required: true,
      default: {
        [AdminResourceOperationsEnum.CREATE]: false,
        [AdminResourceOperationsEnum.READ]: false,
        [AdminResourceOperationsEnum.UPDATE]: false,
        [AdminResourceOperationsEnum.DELETE]: false,
        [AdminResourceOperationsEnum.FILTER]: false,
      },
    },
  },
  { _id: false },
);
