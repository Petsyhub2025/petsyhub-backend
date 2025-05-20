import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { AWS_LAMBDA_CLIENT } from '@common/modules/aws-lambda/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { LambdaResponse } from '@serverless/common/classes/lambda-response.class';

@Injectable()
export class AwsLambdaService {
  private readonly logger = new Logger(AwsLambdaService.name);
  constructor(@Inject(AWS_LAMBDA_CLIENT) private lambdaClient: LambdaClient) {}

  async invokeLambdaFunction<PayloadType = any>(functionName: string, payload: any) {
    try {
      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: Buffer.from(JSON.stringify(payload)),
      });

      const response = await this.lambdaClient.send(command);
      const payloadBuffer = Buffer.from(response.Payload);

      if (!payloadBuffer) {
        return null;
      }

      const payloadString = payloadBuffer.toString('utf-8');

      return JSON.parse(payloadString) as LambdaResponse<PayloadType>;
    } catch (error) {
      this.logger.error(`Error invoking lambda function: ${error.message}`, { error });
      return null;
    }
  }
}
