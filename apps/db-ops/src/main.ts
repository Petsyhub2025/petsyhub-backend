import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { OpsRunner } from './classes/ops-runner.class';
import { DataTransformationService } from './modules/data-transformation/services/data-transformation.service';
import { DbIndexesService } from './modules/db-indexes/services/db-indexes.service';
import inquirer from 'inquirer';

type ClassType<T> = new (...args: any[]) => T;
enum DbOpsFlags {
  TRANSFORM_DATA = 'transform-data',
  SYNC_INDEXES = 'sync-indexes',
}

async function bootstrap() {
  const response = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'flags',
      message: 'Select operations to run',
      choices: [
        { name: ' Transform data', value: DbOpsFlags.TRANSFORM_DATA },
        { name: ' Sync indexes', value: DbOpsFlags.SYNC_INDEXES },
      ],
    },
  ]);

  const flags = response.flags as DbOpsFlags[];

  assertDbOpsCommandFlags(flags);

  const app = await NestFactory.create(AppModule);

  const services = getDbOpsDependenciesFromArgs(app, flags);

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    console.log(`Running ${service.constructor.name} from flags: ${flags[i]}`);
    await service.run();
  }

  process.exit(0);
}

function getDbOpsDependenciesFromArgs(app: INestApplication, flags: DbOpsFlags[]) {
  const dependencies: OpsRunner[] = [];

  for (const flag of flags) {
    switch (flag) {
      case DbOpsFlags.TRANSFORM_DATA:
        dependencies.push(getServiceFromApp(DataTransformationService, app));
        break;
      case DbOpsFlags.SYNC_INDEXES:
        dependencies.push(getServiceFromApp(DbIndexesService, app));
        break;
      default:
        throw new Error(`Invalid flag: ${flag}`);
    }
  }

  return dependencies;
}

function assertDbOpsCommandFlags(args: string[]) {
  const flags = Object.values(DbOpsFlags);
  const hasFlag = args.every((arg) => flags.includes(arg as DbOpsFlags)) && args.length > 0;
  if (!hasFlag) {
    throw new Error(`Invalid command flags, valid flags are: ${flags.join(', ')}`);
  }
}

function getServiceFromApp<T extends OpsRunner>(service: ClassType<T>, app: INestApplication) {
  return app.get<T>(service);
}

bootstrap();
