import { Logger } from '@serverless/common/classes/logger.class';
import { IJobCompletionEvent } from '@serverless/video-job-analysis/interfaces/job-completion.interface';
import { ISnsTopicMessage } from '../interfaces/sns-topic-message.interface';
import { jobCompletionValidationSchema } from '../validations/joi';
import { processJobCompletionEvent } from './job.helper';

export async function processEvent(event: ISnsTopicMessage) {
  const records = event.Records.filter(
    (record) => record.Sns.TopicArn === process.env.AWS_SNS_VIDEO_ANALYSIS_TOPIC_ARN,
  );

  if (!records.length) {
    throw new Error('Invalid event: No records found for the video analysis topic');
  }

  for (const record of records) {
    const message = parseSnsMessage(record.Sns.Message);

    const { error: jobCompletionValidationError } = jobCompletionValidationSchema.validate(message);

    if (jobCompletionValidationError) {
      Logger.getInstance().error(`Invalid event: ${jobCompletionValidationError.message}`, {
        error: jobCompletionValidationError,
      });
      throw new Error(`Invalid event: ${jobCompletionValidationError.message}`);
    }

    Logger.getInstance().log(`Processing job completion event: ${message.JobId}`, { message });

    if (message.Status !== 'SUCCEEDED') {
      Logger.getInstance().warn(`Job ${message.JobId} did not succeed, skipping processing`, { message });
      continue;
    }

    await processJobCompletionEvent(message);
  }
}

function parseSnsMessage(snsMessage: string): IJobCompletionEvent {
  try {
    const message = JSON.parse(snsMessage);
    return message;
  } catch (error) {
    Logger.getInstance().error(`Error parsing SNS message: ${error.message}`, { error });
    throw new Error(`Error parsing SNS message: ${error.message}`);
  }
}
