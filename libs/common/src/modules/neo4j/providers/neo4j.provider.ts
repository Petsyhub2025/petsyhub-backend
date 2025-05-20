import { FactoryProvider, Logger, ValueProvider } from '@nestjs/common';
import * as neo4jDriver from 'neo4j-driver';
import { NEO4J_MODULE_OPTIONS, NEO4J_MODULE_MERGED_OPTIONS, NEO4J_DRIVER } from '../constants';
import { neo4jDefaultOptions } from '../defaults';
import { Neo4jModuleOptions, Neo4jModuleAsyncOptions } from '../interfaces';

export const createNeo4jOptionsProvider = (options: Neo4jModuleOptions): ValueProvider => {
  return {
    provide: NEO4J_MODULE_OPTIONS,
    useValue: options || {},
  };
};

export const createNeo4jAsyncOptionProviders = (options: Neo4jModuleAsyncOptions): FactoryProvider => {
  return {
    provide: NEO4J_MODULE_OPTIONS,
    useFactory: options.useFactory,
    inject: options.inject ?? [],
  };
};

export const neo4jMergedOptionsProvider: FactoryProvider<Neo4jModuleOptions> = {
  provide: NEO4J_MODULE_MERGED_OPTIONS,
  useFactory: (options: Neo4jModuleOptions) => ({
    ...neo4jDefaultOptions,
    ...options,
  }),
  inject: [NEO4J_MODULE_OPTIONS],
};

export const neo4jDriverProvider: FactoryProvider<neo4jDriver.Driver> = {
  provide: NEO4J_DRIVER,
  useFactory: async (options: Neo4jModuleOptions) => {
    const logger = new Logger('Neo4jModule');

    const { loggingLevel } = options.driverOptions ?? {};

    const driver = neo4jDriver.driver(
      options.connectionString,
      neo4jDriver.auth.basic(options.auth.user, options.auth.password),
      options.driverOptions && {
        ...(loggingLevel && {
          logging: {
            level: options.driverOptions.loggingLevel,
            logger: (level, message) => logger.log(message),
          },
        }),
      },
    );
    logger.log('Neo4j driver created successfully');
    return driver;
  },
  inject: [NEO4J_MODULE_MERGED_OPTIONS],
};
