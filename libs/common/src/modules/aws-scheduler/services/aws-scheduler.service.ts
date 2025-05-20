import {
  CreateScheduleCommand,
  CreateScheduleCommandInput,
  DeleteScheduleCommand,
  DeleteScheduleCommandInput,
  GetScheduleCommand,
  SchedulerClient,
  UpdateScheduleCommand,
  UpdateScheduleCommandInput,
} from '@aws-sdk/client-scheduler';
import { AWS_SCHEDULER_CLIENT } from '@common/modules/aws-scheduler/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AwsSchedulerService {
  constructor(@Inject(AWS_SCHEDULER_CLIENT) private schedulerClient: SchedulerClient) {}

  async createSchedule(options: CreateScheduleCommandInput) {
    try {
      const command = new CreateScheduleCommand(options);

      const result = await this.schedulerClient.send(command);

      return result;
    } catch (error) {
      new Logger('AwsSchedulerService').error(`Failed to schedule job in EventBridgeScheduler: ${error?.message}`, {
        error,
      });
      throw new Error('Failed to schedule job');
    }
  }

  async deleteSchedule(options: DeleteScheduleCommandInput) {
    try {
      const command = new DeleteScheduleCommand(options);

      const result = await this.schedulerClient.send(command);

      return result;
    } catch (error) {
      new Logger('AwsSchedulerService').error(`Failed to delete schedule in EventBridgeScheduler: ${error?.message}`, {
        error,
      });
      throw new Error('Failed to delete schedule');
    }
  }

  async updateSchedule(
    options: Pick<UpdateScheduleCommandInput, 'Name' | 'ScheduleExpression' | 'ScheduleExpressionTimezone'>,
  ) {
    try {
      const { Name, ...restOfOptions } = options;

      const getCommand = new GetScheduleCommand({ Name });
      const { FlexibleTimeWindow, ScheduleExpression, ScheduleExpressionTimezone, Target } =
        await this.schedulerClient.send(getCommand);

      const updateCommand = new UpdateScheduleCommand({
        Name,
        FlexibleTimeWindow,
        ScheduleExpression,
        ScheduleExpressionTimezone,
        Target,
        ...restOfOptions,
      });

      const result = await this.schedulerClient.send(updateCommand);

      return result;
    } catch (error) {
      new Logger('AwsSchedulerService').error(`Failed to update schedule in EventBridgeScheduler: ${error?.message}`, {
        error,
      });
      throw new Error('Failed to update schedule');
    }
  }
}
