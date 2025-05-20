import {
  DynamoDBClient as AwsDynamodbClient,
  GetItemCommand,
  GetItemCommandInput,
  PutItemCommand,
  PutItemCommandInput,
} from '@aws-sdk/client-dynamodb';
import { Logger } from './logger.class';

export class DynamodbClient {
  private static instance: DynamodbClient;
  private dynamodb: AwsDynamodbClient;
  private logger = Logger.getInstance();

  private constructor() {
    this.dynamodb = new AwsDynamodbClient({
      credentials: {
        accessKeyId: process.env.AWS_DYNAMODB_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_DYNAMODB_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_DYNAMODB_REGION,
    });
  }

  public static getInstance(): DynamodbClient {
    if (!DynamodbClient.instance) {
      DynamodbClient.instance = new DynamodbClient();
    }

    return DynamodbClient.instance;
  }

  public async getItem(table: string, params: Omit<GetItemCommandInput, 'TableName'>) {
    try {
      const command = new GetItemCommand({
        TableName: this.getTableName(table),
        ...params,
      });

      return this.dynamodb.send(command);
    } catch (error) {
      this.logger.error('DynamodbClient.getItem', { error });
      throw error;
    }
  }

  public async putItem(table: string, params: Omit<PutItemCommandInput, 'TableName'>) {
    try {
      const command = new PutItemCommand({
        TableName: this.getTableName(table),
        ...params,
      });

      return this.dynamodb.send(command);
    } catch (error) {
      this.logger.error('DynamodbClient.putItem', { error });
      throw error;
    }
  }

  private getTableName(tableName: string) {
    return `instapets-${process.env.NODE_ENV}-${tableName}`;
  }
}
