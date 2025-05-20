import { getIsUserFollowed } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';

export function getEventAggregationPipeline(viewerId: string): PipelineStage[] {
  return [
    {
      $lookup: {
        from: 'users',
        let: { userId: '$authorUser' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$userId', null] }],
              },
            },
          },
          ...getIsUserFollowed(viewerId),
          {
            $project: {
              _id: 1,
              username: 1,
              profilePictureMedia: 1,
              firstName: 1,
              lastName: 1,
              isFollowed: 1,
              isPendingFollow: 1,
              isFollowingMe: 1,
              isUserPendingFollowOnMe: 1,
            },
          },
        ],
        as: 'authorUser',
      },
    },
    {
      $unwind: {
        path: '$authorUser',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'countries',
        let: { countryId: '$placeLocation.locationData.country' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$countryId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'placeLocation.locationData.country',
      },
    },
    {
      $unwind: {
        path: '$placeLocation.locationData.country',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'cities',
        let: { cityId: '$placeLocation.locationData.city' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$cityId', null] }],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
            },
          },
        ],
        as: 'placeLocation.locationData.city',
      },
    },
    {
      $unwind: {
        path: '$placeLocation.locationData.city',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'placeLocation.locationData.location': {
          lat: {
            $arrayElemAt: ['$placeLocation.locationData.location.coordinates', 1],
          },
          lng: {
            $arrayElemAt: ['$placeLocation.locationData.location.coordinates', 0],
          },
        },
      },
    },
    {
      $unset: ['placeLocation.locationData.location.coordinates', 'placeLocation.locationData.location.type'],
    },
    {
      $unwind: {
        path: '$allowedPetTypes',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'pettypes',
        let: { typeId: '$allowedPetTypes.petType' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$typeId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'allowedPetTypes.petType',
      },
    },
    {
      $unwind: {
        path: '$allowedPetTypes.petType',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$allowedPetTypes.specificPetBreeds',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'petbreeds',
        let: { breedId: '$allowedPetTypes.specificPetBreeds' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$breedId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'allowedPetTypes.specificPetBreeds',
      },
    },
    {
      $unwind: {
        path: '$allowedPetTypes.specificPetBreeds',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        allowedPetTypes: {
          $push: '$allowedPetTypes',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$doc', { allowedPetTypes: '$allowedPetTypes' }],
        },
      },
    },
    {
      $lookup: {
        from: 'eventcategories',
        let: { categoryId: '$category' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$categoryId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'category',
      },
    },
    {
      $unwind: {
        path: '$category',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: '$facilities',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'eventfacilities',
        let: { facilityId: '$facilities' },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$_id', { $ifNull: ['$$facilityId', null] }],
              },
            },
          },
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'facilities',
      },
    },
    {
      $unwind: {
        path: '$facilities',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        doc: {
          $first: '$$ROOT',
        },
        facilities: {
          $push: '$facilities',
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ['$doc', { facilities: '$facilities' }],
        },
      },
    },
    {
      $lookup: {
        from: 'eventrsvps',
        let: { eventId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$event', { $ifNull: ['$$eventId', null] }] },
                  { $eq: ['$user', new Types.ObjectId(viewerId)] },
                ],
              },
            },
          },
          {
            $project: {
              _id: 0,
              response: 1,
            },
          },
        ],
        as: 'myRsvpResponse',
      },
    },
    {
      $unwind: {
        path: '$myRsvpResponse',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        myRsvpResponse: '$myRsvpResponse.response',
      },
    },
    {
      $project: {
        authorUser: 1,
        title: 1,
        description: 1,
        type: 1,
        media: 1,
        capacity: 1,
        disableRsvpAtFullCapacity: 1,
        pricingInformation: 1,
        startDate: 1,
        endDate: 1,
        placeLocation: 1,
        allowedPetTypes: 1,
        category: 1,
        facilities: 1,
        createdAt: 1,
        dynamicLink: 1,
        cancelledAt: 1,
        cancellationReason: 1,
        totalGoing: 1,
        totalInterested: 1,
        myRsvpResponse: 1,
      },
    },
  ];
}
