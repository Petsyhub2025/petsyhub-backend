import dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { LambdaResponse } from '@serverless/common/classes/lambda-response.class';
import { Logger } from '@serverless/common/classes/logger.class';
import { assertEnv, validateClass } from '@serverless/common/helpers';
import { processPayload } from './helpers/event.helper';
import { mediaValidationSchema } from './validations/joi';
import { MediaModerationLambdaEvent } from '@serverless/common/classes/validations/media-moderation-lambda-event.class';

export const lambdaHandler = async (event: string) => {
  console.log('event', event);

  try {
    assertEnv();
  } catch (error) {
    console.error(`Error in lambdaHandler: ${error.message}`, { error });

    return LambdaResponse.error(`Error in lambda: ${error.message}`, error);
  }

  try {
    Logger.initialize({ hostname: 'media-moderation' });

    if (!event) {
      throw new Error('Invalid event');
    }

    let payload: MediaModerationLambdaEvent;
    if (typeof event === 'string') {
      try {
        payload = JSON.parse(event);
      } catch (error) {
        throw new Error('Invalid JSON event');
      }
    } else {
      payload = event;
    }

    await validateClass(payload, MediaModerationLambdaEvent);
    const { error } = mediaValidationSchema.validate(payload);

    if (error) {
      Logger.getInstance().error(`Invalid payload: ${error.message}`, { error });
      throw new Error(`Invalid payload: ${error.message}`);
    }

    const response = await processPayload(payload);

    console.log('response', response);

    return LambdaResponse.success(response);
  } catch (error) {
    Logger.getInstance().error(`Error in lambdaHandler: ${error.message}`, { error });

    return LambdaResponse.error(`[ERROR]: ${error.message}`, error);
  }
};
