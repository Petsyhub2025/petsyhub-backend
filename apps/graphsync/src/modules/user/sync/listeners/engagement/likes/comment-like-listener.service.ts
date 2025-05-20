import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { CommentLike, CustomLoggerService, ICommentLikeModel, ModelNames } from '@instapets-backend/common';
import { CommentLikeSynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class CommentLikeListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly commentLikeSynchronizer: CommentLikeSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.COMMENT_LIKE) private commentLikeModel: ICommentLikeModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(CommentLikeListenerService.name);

    const changeStream = this.commentLikeModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(CommentLikeListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.commentLikeSynchronizer.syncToNeo4j(change.fullDocument as Hydrate<CommentLike>);
              break;
            case 'delete':
              await this.commentLikeSynchronizer.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync commentLike to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${CommentLikeListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${CommentLikeListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${CommentLikeListenerService.name}`);

        await this.handleStreamClosing(CommentLikeListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${CommentLikeListenerService.name}`);
      });
  }
}
