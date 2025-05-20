import { BadRequestException, Controller, Headers, Post, Req, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { StripeWebhooksService } from './stripe-webhooks.service';
import { CustomLoggerService, IsPrivateAuthOrPublic, NoApiVersion } from '@instapets-backend/common';
import RequestWithRawBody from './interfaces/request-with-raw-body.interface';

@Controller({ path: 'stripe-webhooks', version: VERSION_NEUTRAL })
@ApiTags('stripe-webhooks')
export class StripeWebhooksController {
  constructor(
    private readonly stripeWebhooksService: StripeWebhooksService,
    private readonly logger: CustomLoggerService,
  ) {}

  @IsPrivateAuthOrPublic()
  @NoApiVersion()
  @Post('public/webhook')
  async handleStripeWebhook(@Req() request: RequestWithRawBody, @Headers('stripe-signature') stripeSignature: string) {
    if (!stripeSignature) {
      this.logger.log('Missing stripe-signature header');
      throw new BadRequestException('Missing stripe-signature header');
    }

    await this.stripeWebhooksService.handleStripeWebhook(request.rawBody, stripeSignature);
    return {
      success: true,
    };
  }
}
