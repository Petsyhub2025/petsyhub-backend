import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { globalControllerVersioning } from '@pets/shared/constants';
import { MatchesService } from './matches.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { GetMatchesQueryDto } from './dto/get-matches.dto';
import { RequestMatchDto } from './dto/request-match.dto';
import { GetMatchRequestsQueryDto } from './dto/get-match-requests.dto';
import { MatchIdParamDto } from './dto/match-id-param.dto';

@Controller({ path: 'matches', ...globalControllerVersioning })
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @ApiBearerAuth()
  @Get()
  async getMatches(@Persona() userJWT: UserJwtPersona, @Query() query: GetMatchesQueryDto) {
    const matches = await this.matchesService.getMatches(userJWT._id, query);

    return new CustomResponse().success({
      payload: matches,
    });
  }

  @ApiBearerAuth()
  @Post()
  async requestMatch(@Persona() userJWT: UserJwtPersona, @Body() body: RequestMatchDto) {
    await this.matchesService.requestMatch(userJWT._id, body);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Get('match-requests')
  async getMatchRequests(@Persona() userJWT: UserJwtPersona, @Query() query: GetMatchRequestsQueryDto) {
    const matches = await this.matchesService.getMatchRequests(userJWT._id, query);

    return new CustomResponse().success({
      payload: matches,
    });
  }

  @ApiBearerAuth()
  @Post(':matchId/accept')
  async acceptMatch(@Persona() userJWT: UserJwtPersona, @Param() param: MatchIdParamDto) {
    await this.matchesService.acceptMatch(userJWT._id, param);

    return new CustomResponse().success({});
  }

  @ApiBearerAuth()
  @Post(':matchId/reject')
  async rejectMatch(@Persona() userJWT: UserJwtPersona, @Param() param: MatchIdParamDto) {
    await this.matchesService.rejectMatch(userJWT._id, param);

    return new CustomResponse().success({});
  }
}
