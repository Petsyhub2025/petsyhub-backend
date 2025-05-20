import { Injectable } from '@nestjs/common';
import { CustomLoggerService } from '@instapets-backend/common';
import { RedisService } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import { ResumeToken } from 'mongodb';

@Injectable()
export class ChangeStreamTokenUtil {
  private readonly redis: Redis;

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async setResumeToken(context: string, resumeToken: ResumeToken) {
    const stringifiedResumeToken = JSON.stringify(resumeToken);

    try {
      const res = await this.redis.set(`${context}-esResumeToken`, stringifiedResumeToken);

      // this.logger.log(`set ${context}-resumeToken`, {
      //   context,
      //   stringifiedResumeToken,
      //   res,
      // });
    } catch (error) {
      this.logger.error(`[${context}]: Failed to set es resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
        resumeToken,
      });
    }
  }

  async getResumeToken(context: string): Promise<object | null> {
    try {
      const resumeToken = await this.redis.get(`${context}-esResumeToken`);

      // this.logger.log(`get ${context}-esResumeToken`, {
      //   context,
      //   resumeToken,
      // });

      if (!resumeToken) {
        return null;
      }

      return JSON.parse(resumeToken);
    } catch (error) {
      this.logger.error(`[${context}]: Failed to get es resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
      });

      return null;
    }
  }

  async deleteResumeToken(context: string) {
    try {
      const res = await this.redis.del(`${context}-esResumeToken`);

      // this.logger.log(`delete ${context}-esResumeToken`, {
      //   context,
      //   res,
      // });
    } catch (error) {
      this.logger.error(`[${context}]: Failed to delete es resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
      });
    }
  }
}
