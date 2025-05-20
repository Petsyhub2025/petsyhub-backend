import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { globalControllerVersioning } from '@users/shared/constants';
import { CustomResponse, Persona, UserJwtPersona } from '@instapets-backend/common';
import { FinalizeOnboardingDto } from './dto/finalize-onboarding.dto';
import { UserOnboardingService } from './user-onboarding.service';

@Controller({ path: 'onboarding', ...globalControllerVersioning })
@ApiTags('user/onboarding')
export class UserOnboardingController {
  constructor(private readonly userOnboardingService: UserOnboardingService) {}

  @ApiBearerAuth()
  @Patch('/finalize-onboarding')
  async finalizeOnboarding(@Persona() userJWT: UserJwtPersona, @Body() body: FinalizeOnboardingDto) {
    const result = await this.userOnboardingService.finalizeOnboarding(userJWT._id, body);

    return new CustomResponse().success({ payload: { data: result } });
  }
}
