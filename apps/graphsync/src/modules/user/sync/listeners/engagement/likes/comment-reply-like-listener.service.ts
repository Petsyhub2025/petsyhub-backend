import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { CommentReplyLike, CustomLoggerService, ICommentReplyLikeModel, ModelNames } from '@instapets-backend/common';
import { CommentReplyLikeSynchronizerService } from '@graphsync/user/sync';
import { BaseListenerService } from '@graphsync/user/sync/listeners/base-listener.service';

@Injectable()
export class CommentReplyLikeListenerService extends BaseListenerService implements OnModuleInit {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly commentReplyLikeSynchronizer: CommentReplyLikeSynchronizerService,
    private readonly resumeTokenService: ResumeTokenService,
    @Inject(ModelNames.COMMENT_REPLY_LIKE) private commentReplyLikeModel: ICommentReplyLikeModel,
  ) {
    super(logger, resumeTokenService);
  }

  async onModuleInit() {
    const resumeToken = await this.resumeTokenService.getResumeToken(CommentReplyLikeListenerService.name);

    const changeStream = this.commentReplyLikeModel
      .watch(undefined, {
        fullDocument: 'updateLookup',
        ...(resumeToken && { startAfter: resumeToken }),
      })
      .on('change', async (change) => {
        try {
          await this.resumeTokenService.setResumeToken(CommentReplyLikeListenerService.name, change._id as object);

          switch (change.operationType) {
            case 'insert':
            case 'update':
            case 'replace':
              await this.commentReplyLikeSynchronizer.syncToNeo4j(change.fullDocument as Hydrate<CommentReplyLike>);
              break;
            case 'delete':
              await this.commentReplyLikeSynchronizer.deleteFromNeo4j(change.documentKey?._id?.toString());
              break;
            default:
              break;
          }
        } catch (error: any) {
          this.logger.error(`Failed to sync commentReplyLike to Neo4j`, {
            error: { message: error?.message, stack: error?.stack },
            change,
          });
        }
      })
      .on('error', async (error) => {
        this.logger.error(`[${CommentReplyLikeListenerService.name}]: Change stream error`, {
          error: { message: error?.message, stack: error?.stack },
        });

        this.logger.log(`[${CommentReplyLikeListenerService.name}]: Restarting listener...`);

        await changeStream.close();
        await this.onModuleInit();
      })
      .on('close', async () => {
        this.logger.error(`Change stream was closed for ${CommentReplyLikeListenerService.name}`);

        await this.handleStreamClosing(CommentReplyLikeListenerService.name, this.onModuleInit.bind(this));
      })
      .on('end', () => {
        this.logger.error(`Change stream was ended for ${CommentReplyLikeListenerService.name}`);
      });
  }
}
