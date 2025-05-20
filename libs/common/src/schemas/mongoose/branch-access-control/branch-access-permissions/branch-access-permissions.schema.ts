import { Schema, SchemaDefinition, SchemaDefinitionType } from 'mongoose';
import {
  BranchAccessPermissionOperations,
  BranchAccessResourceOperationsEnum,
} from './branch-access-permissions-operations.type';
import { BranchAccessResourcesEnum } from './branch-access-permissions-resources.enum';
import { BranchAccessPermissions } from './branch-access-permissions.type';

export const BranchAccessPermissionOperationSchema = new Schema<BranchAccessPermissionOperations>(
  {
    ...(() => {
      const obj: SchemaDefinition<SchemaDefinitionType<BranchAccessPermissionOperations>> = Object.create({});
      Object.values(BranchAccessResourceOperationsEnum).forEach((operation) => {
        obj[operation] = { type: Boolean, required: false };
      });
      return obj;
    })(),
  },
  { _id: false },
);

export const BranchAccessPermissionSchema = new Schema<BranchAccessPermissions>(
  {
    [BranchAccessResourcesEnum.BRANCHES]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.APPOINTMENTS]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.STAFF_MEMBERS]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.PRODUCT_CATEGORIES]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.PRODUCTS]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.INVENTORY]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.ORDERS]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.CREATE]: false,
        [BranchAccessResourceOperationsEnum.READ]: false,
        [BranchAccessResourceOperationsEnum.UPDATE]: false,
        [BranchAccessResourceOperationsEnum.DELETE]: false,
        [BranchAccessResourceOperationsEnum.FILTER]: false,
      },
    },
    [BranchAccessResourcesEnum.CUSTOMERS]: {
      type: BranchAccessPermissionOperationSchema,
      required: true,
      default: {
        [BranchAccessResourceOperationsEnum.READ]: false,
      },
    },
  },
  { _id: false },
);
