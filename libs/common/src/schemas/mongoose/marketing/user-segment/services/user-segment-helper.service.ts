import { DeviceVersionSubSchemaType } from '@common/schemas/mongoose/marketing/user-segment/user-segment-subschemas/user-device/version';
import { UserSegment } from '@common/schemas/mongoose/marketing/user-segment/user-segment.type';
import { Injectable } from '@nestjs/common';

type UserSegmentWithoutTitleAndDescription = Omit<UserSegment, 'title' | 'description'>;
@Injectable()
export class UserSegmentHelperService {
  constructor() {}

  getUserSegmentQueryFilters(userSegment: UserSegment | UserSegmentWithoutTitleAndDescription) {
    const {
      locations,
      petTypes,
      petStatuses,
      devices,
      hasAttendedEvents,
      hasHostedEvents,
      totalPets,
      totalFollowers,
      age,
    } = userSegment;

    const devicesFilter = {
      $or: Object.entries(devices ?? {}).map(([deviceType, { max, min }]: [string, DeviceVersionSubSchemaType]) => ({
        'devices.platform': deviceType,
        ...(min && {
          $or: [
            { 'devices.installedVersion.major': { $gte: min.major } },
            {
              'devices.installedVersion.major': { $eq: min.major },
              'devices.installedVersion.minor': { $gte: min.minor },
            },
            {
              'devices.installedVersion.major': { $eq: min.major },
              'devices.installedVersion.minor': { $eq: min.minor },
              'devices.installedVersion.patch': { $gte: min.patch },
            },
          ],
        }),
        ...(max && {
          $or: [
            { 'devices.installedVersion.major': { $lte: max.major } },
            {
              'devices.installedVersion.major': { $eq: max.major },
              'devices.installedVersion.minor': { $lte: max.minor },
            },
            {
              'devices.installedVersion.major': { $eq: max.major },
              'devices.installedVersion.minor': { $eq: max.minor },
              'devices.installedVersion.patch': { $lte: max.patch },
            },
          ],
        }),
      })),
    };

    const ageFilter = () => {
      if (!age) return undefined;

      const { min, max } = age;

      const currentDate = new Date();
      const minTimestamp = new Date(currentDate.getFullYear() - max, 0, 1, 0, 0, 0, 0).getTime();
      const maxTimestamp = new Date(currentDate.getFullYear() - min, 11, 31, 23, 59, 59, 999).getTime();

      return {
        birthDateTimestamp: {
          ...(min && !isNaN(minTimestamp) && { $gte: minTimestamp }),
          ...(max && !isNaN(maxTimestamp) && { $lte: maxTimestamp }),
        },
      };
    };

    const filters = {
      $and: [
        { ...(locations?.length && { $or: locations }) },
        { ...(petTypes?.length && { 'ownedPets.type': { $in: petTypes } }) },
        { ...(petStatuses?.length && { 'ownedPets.status': { $in: petStatuses } }) },
        { ...(devices && devicesFilter) },
        { ...(hasAttendedEvents && { totalEventsAttended: { $gt: 0 } }) },
        { ...(hasHostedEvents && { totalEventsHosted: { $gt: 0 } }) },
        {
          ...(totalPets && {
            totalPets: {
              ...(totalPets.min && { $gte: totalPets.min }),
              ...(totalPets.max && { $lte: totalPets.max }),
            },
          }),
        },
        {
          ...(totalFollowers && {
            totalFollowers: {
              ...(totalFollowers.min && { $gte: totalFollowers.min }),
              ...(totalFollowers.max && { $lte: totalFollowers.max }),
            },
          }),
        },
        { ...ageFilter() },
      ],
    };

    return filters;
  }
}
