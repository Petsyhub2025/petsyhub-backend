import { Module, OnApplicationShutdown, DynamicModule, Provider, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { NEO4J_DRIVER } from './constants';
import { Neo4jModuleOptions, Neo4jModuleAsyncOptions } from './interfaces';
import {
  createNeo4jOptionsProvider,
  neo4jMergedOptionsProvider,
  neo4jDriverProvider,
  createNeo4jAsyncOptionProviders,
} from './providers';
import { Neo4jHealthService, Neo4jService } from './services';
import * as neo4jDriver from 'neo4j-driver';

@Module({})
export class Neo4jModule implements OnApplicationShutdown {
  constructor(private moduleRef: ModuleRef) {}

  static register(options: Neo4jModuleOptions): DynamicModule {
    const providers: Provider[] = [
      createNeo4jOptionsProvider(options),
      neo4jMergedOptionsProvider,
      neo4jDriverProvider,
      Neo4jService,
      Neo4jHealthService,
    ];

    return {
      module: Neo4jModule,
      global: true,
      providers,
      exports: [Neo4jService, Neo4jHealthService],
    };
  }

  static registerAsync(options: Neo4jModuleAsyncOptions): DynamicModule {
    if (!options.useFactory) throw new Error('Missing Configurations for Neo4jModule: useFactory is required');

    const providers: Provider[] = [
      createNeo4jAsyncOptionProviders(options),
      neo4jMergedOptionsProvider,
      neo4jDriverProvider,
      Neo4jService,
      Neo4jHealthService,
    ];

    return {
      module: Neo4jModule,
      global: true,
      imports: options.imports || [],
      providers,
      exports: [Neo4jService, Neo4jHealthService],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    const driver = this.moduleRef.get<neo4jDriver.Driver>(NEO4J_DRIVER);
    await driver.close();
    new Logger('Neo4jModule').log('Neo4j driver closed successfully');
  }
}
