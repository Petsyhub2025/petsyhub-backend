import { ITestingContainer } from '@testing/interfaces';

export enum TestingContainersEnum {
  RABBIT_MQ = 'rabbitmq',
  REDIS = 'redis',
  MONGO_DB = 'mongodb',
}

export const TestingContainers: Record<TestingContainersEnum, ITestingContainer> = {
  [TestingContainersEnum.RABBIT_MQ]: {
    uri: 'amqp://localhost:5672',
  },
  [TestingContainersEnum.REDIS]: {
    host: 'localhost',
    port: 6379,
  },
  [TestingContainersEnum.MONGO_DB]: {
    uri: 'mongodb://localhost:27017',
  },
};
