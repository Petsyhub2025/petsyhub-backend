import dotenv from 'dotenv';
dotenv.config();
import 'reflect-metadata';
import { LambdaResponse } from '@serverless/common/classes/lambda-response.class';
import { Logger } from '@serverless/common/classes/logger.class';
import { assertEnv } from '@serverless/common/helpers';
import { processEvent } from './helpers/event.helper';
import { ISnsTopicMessage } from './interfaces/sns-topic-message.interface';
import { snsTopicMessageValidationSchema } from './validations/joi/sns-topic-message-schema.validation';

export const lambdaHandler = async (event: ISnsTopicMessage) => {
  console.log('event', JSON.stringify(event, null, 2));

  try {
    assertEnv();
  } catch (error) {
    console.error(`Error in lambdaHandler: ${error.message}`, { error });

    return LambdaResponse.error(`Error in lambda: ${error.message}`, error);
  }

  try {
    Logger.initialize({ hostname: 'video-job-analysis' });

    if (!event) {
      throw new Error('Invalid event');
    }

    const { error: snsTopicMessageValidationError } = snsTopicMessageValidationSchema.validate(event);

    if (snsTopicMessageValidationError) {
      Logger.getInstance().error(`Invalid event: ${snsTopicMessageValidationError.message}`, {
        error: snsTopicMessageValidationError,
      });
      throw new Error(`Invalid event: ${snsTopicMessageValidationError.message}`);
    }

    await processEvent(event);
  } catch (error) {
    Logger.getInstance().error(`Error in lambdaHandler: ${error.message}`, { error });
  }
};
