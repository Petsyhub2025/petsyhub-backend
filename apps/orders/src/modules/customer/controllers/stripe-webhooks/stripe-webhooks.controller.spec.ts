import { Test, TestingModule } from '@nestjs/testing';
import { StripeWebhooksController } from './stripe-webhooks.controller';

describe('StripeWebhooksController', () => {
  let controller: StripeWebhooksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StripeWebhooksController],
    }).compile();

    controller = module.get<StripeWebhooksController>(StripeWebhooksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
