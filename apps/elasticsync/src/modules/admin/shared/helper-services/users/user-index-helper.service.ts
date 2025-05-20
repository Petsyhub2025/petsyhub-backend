import { BaseIndexHelper, ChangeStreamTokenUtil } from '@elasticsync/admin/shared/helpers';
import { Inject, Injectable } from '@nestjs/common';
import { PaginationService } from '@elasticsync/shared-module/utils/pagination.service';
import { CustomLoggerService, ElasticsearchService, IUserModel, ModelNames } from '@instapets-backend/common';
import { PipelineStage, Types } from 'mongoose';
import { CommentReplyIndexHelperService } from '@elasticsync/admin/shared/helper-services/comment-replies';
import { CommentIndexHelperService } from '@elasticsync/admin/shared/helper-services/comments';
import { PetFollowsIndexHelperService } from '@elasticsync/admin/shared/helper-services/pet-follows';
import { PetIndexHelperService } from '@elasticsync/admin/shared/helper-services/pets';
import { PostIndexHelperService } from '@elasticsync/admin/shared/helper-services/posts';
import { UserFollowsIndexHelperService } from '@elasticsync/admin/shared/helper-services/user-follows';
import { AppointmentsIndexHelperService } from '@elasticsync/admin/shared/helper-services/appointments';
import {
  FoundPostIndexHelperService,
  LostPostIndexHelperService,
} from '@elasticsync/admin/shared/helper-services/lost-found-posts';

@Injectable()
export class UserIndexHelperService extends BaseIndexHelper {
  pipeline: PipelineStage[];
  constructor(
    protected logger: CustomLoggerService,
    protected elasticsearchService: ElasticsearchService,
    protected readonly changeStreamTokenUtil: ChangeStreamTokenUtil,
    private readonly paginationService: PaginationService,
    @Inject(ModelNames.USER) private userModel: IUserModel,
    //dependent models
    private readonly commentReplyIndexHelperService: CommentReplyIndexHelperService,
    private readonly commentIndexHelperService: CommentIndexHelperService,
    private readonly petIndexHelperService: PetIndexHelperService,
    private readonly postIndexHelperService: PostIndexHelperService,
    private readonly userFollowsIndexHelperService: UserFollowsIndexHelperService,
    private readonly petFollowsIndexHelperService: PetFollowsIndexHelperService,
    private readonly appointmentsIndexHelperService: AppointmentsIndexHelperService,
    private readonly lostPostIndexHelperService: LostPostIndexHelperService,
    private readonly foundPostIndexHelperService: FoundPostIndexHelperService,
  ) {
    super(changeStreamTokenUtil, logger, elasticsearchService, userModel);
    this.esSchema = {
      fullName: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
          sayt: {
            type: 'search_as_you_type',
          },
        },
      },
      username: {
        type: 'text',
        fields: {
          keyword: {
            type: 'keyword',
            ignore_above: 256,
          },
          sayt: {
            type: 'search_as_you_type',
          },
        },
      },
      isViewable: {
        type: 'boolean',
      },
      country: {
        type: 'text',
      },
      city: {
        type: 'text',
      },
      role: {
        type: 'text',
      },
      createdAt: {
        type: 'date',
      },
      totalPets: {
        type: 'integer',
      },
    };
    this.pipeline = [
      {
        $project: {
          deletedAt: 1,
          isViewable: 1,
          _id: 1,
          fullName: {
            $concat: [
              { $ifNull: ['$firstName', ''] },
              {
                $cond: {
                  if: {
                    $and: [{ $gt: ['$lastName', null] }, { $gt: ['$firstName', null] }],
                  },
                  then: ' ',
                  else: '',
                },
              },
              { $ifNull: ['$lastName', ''] },
            ],
          },
          username: 1,
          createdAt: 1,
          role: 1,
          country: 1,
          city: 1,
          totalPets: 1,
        },
      },
    ];
  }

  async migrate() {
    await this.syncCollection();
    this.logger.log(`${this.indexName} has been created successfully`);
  }

  async syncCollection(_ids: string[] = []) {
    const matchStage: PipelineStage[] = _ids?.length
      ? [{ $match: { _id: { $in: _ids.map((_id) => new Types.ObjectId(_id)) } } }]
      : [{ $match: {} }];

    await this.paginationService.paginateAggregate(this.userModel, matchStage, this.pipeline, async (docs) => {
      await this.synchronizeDocument(docs);
    });
  }

  syncDependencies(_id: string) {
    return Promise.all([
      this.commentReplyIndexHelperService.syncUserUpdates(_id),
      this.commentIndexHelperService.syncUserUpdates(_id),
      this.petIndexHelperService.syncUserUpdates(_id),
      this.postIndexHelperService.syncUserUpdates(_id),
      this.userFollowsIndexHelperService.syncUserUpdates(_id),
      this.petFollowsIndexHelperService.syncUserUpdates(_id),
      this.appointmentsIndexHelperService.syncUserUpdates(_id),
      this.lostPostIndexHelperService.syncUserUpdates(_id),
      this.foundPostIndexHelperService.syncUserUpdates(_id),
    ]);
  }
}
