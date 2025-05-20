import { Injectable } from '@nestjs/common';
import { ResumeTokenService } from '@graphsync/shared-module/utils/resume-token.service';
import { CustomLoggerService } from '@instapets-backend/common';
import { Subject, lastValueFrom, interval, take, tap, switchMap, catchError, of } from 'rxjs';

@Injectable()
export class BaseListenerService {
  private readonly RETRY_DELAY = 2000;
  private readonly MAX_RETRY_WITH_TOKEN_COUNT = 3;
  private readonly MAX_RETRY_WITHOUT_TOKEN_COUNT = 3;
  private retryCount = 0;
  private resetCountSubject = new Subject<void>();

  isRetryingWithoutToken = false;

  constructor(
    private readonly _logger: CustomLoggerService,
    private readonly _resumeTokenService: ResumeTokenService,
  ) {
    this.initResetRetryCountSubject();
  }

  async handleStreamClosing(context: string, listenFunction: () => Promise<void>) {
    if (this.retryCount >= this.MAX_RETRY_WITH_TOKEN_COUNT && !this.isRetryingWithoutToken) {
      this._logger.error(`Failed to listen to changes for ${context} with token, retrying without token`);

      await this._resumeTokenService.deleteResumeToken(context);

      this.isRetryingWithoutToken = true;
      this.retryCount = 0;
    }

    if (this.retryCount >= this.MAX_RETRY_WITHOUT_TOKEN_COUNT && this.isRetryingWithoutToken) {
      this._logger.error(`Failed to listen to changes for ${context} without token, exiting`);

      process.exit(1);
    }

    this.retryCount++;

    if (this.isRetryingWithoutToken) {
      this._logger.log(`[${context}]: Retrying without token`);
    } else {
      this._logger.log(`[${context}]: Retrying with token`);
    }

    await lastValueFrom(
      interval(this.RETRY_DELAY).pipe(
        take(1),
        tap(async () => {
          await listenFunction();
          this.resetCountSubject.next();
        }),
        catchError((error) => {
          this._logger.error(`[${context}]: Change stream error`, {
            error: { message: error?.message, stack: error?.stack },
          });
          return of(null);
        }),
      ),
    );
  }

  private initResetRetryCountSubject() {
    this.resetCountSubject.pipe(switchMap(() => interval(this.RETRY_DELAY * 10).pipe(take(1)))).subscribe(() => {
      this.retryCount = 0;
      this.isRetryingWithoutToken = false;
    });
  }
}
