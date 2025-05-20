import { Injectable } from '@nestjs/common';
import { RedisService } from '@songkeys/nestjs-redis';
import { CustomLoggerService } from '@instapets-backend/common';
import Redis from 'ioredis';

@Injectable()
export class ResumeTokenService {
  private readonly redis: Redis;

  constructor(
    private readonly logger: CustomLoggerService,
    private readonly redisService: RedisService,
  ) {
    this.redis = this.redisService.getClient();
  }

  async setResumeToken(context: string, resumeToken: object) {
    const stringifiedResumeToken = JSON.stringify(resumeToken);

    try {
      await this.redis.set(`${context}-resumeToken`, stringifiedResumeToken);
    } catch (error) {
      this.logger.error(`[${context}]: Failed to set resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
        resumeToken,
      });
    }
  }

  async getResumeToken(context: string): Promise<object | null> {
    try {
      const resumeToken = await this.redis.get(`${context}-resumeToken`);

      if (!resumeToken) {
        return null;
      }

      return JSON.parse(resumeToken);
    } catch (error) {
      this.logger.error(`[${context}]: Failed to get resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
      });

      return null;
    }
  }

  async deleteResumeToken(context: string) {
    try {
      await this.redis.del(`${context}-resumeToken`);
    } catch (error) {
      this.logger.error(`[${context}]: Failed to delete resume token`, {
        error: { message: error?.message, stack: error?.stack },
        context,
      });
    }
  }
}
