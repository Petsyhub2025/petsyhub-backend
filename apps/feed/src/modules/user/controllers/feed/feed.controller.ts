import { DiceRoll } from '@dice-roller/rpg-dice-roller';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CustomLoggerService, CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { GetFeedQueryDto } from './dto/get-feed.dto';
import { FeedService } from './feed.service';
import { globalControllerVersioning } from '@feed/shared-module/constants';

@ApiTags('user')
@Controller({ path: 'feed', ...globalControllerVersioning })
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly logger: CustomLoggerService,
  ) {}

  @ApiBearerAuth()
  @Get()
  async getFeed(@Persona() user: UserJwtPersona, @Query() query: GetFeedQueryDto) {
    const { feed, isInjectionRound } = await this.feedService.getFeed(user, query);
    // eslint-disable-next-line no-console
    console.log('feed ---> ', feed);

    const enrichedFeed = await this.feedService.enrichFeed(feed, user);

    if (isInjectionRound) {
      this.rollForInjectionRound(enrichedFeed);
    }

    return new CustomResponse().success({
      payload: { data: enrichedFeed },
    });
  }

  private async rollForInjectionRound(feed: any[]) {
    const allCases = ['RecommendedPets', 'RecommendedUsers'];
    const casesRoll = new DiceRoll('1d2').total;
    const caseToInject = allCases[casesRoll - 1];
    // Roll from 2nd to last element - 1
    if (feed.length > 2) {
      const placeToInject = new DiceRoll(`1d${feed.length - 2}`).total;
      feed.splice(placeToInject, 0, {
        id: -1,
        contentType: caseToInject,
        content: null,
        action: null,
      });
    }
  }
}
