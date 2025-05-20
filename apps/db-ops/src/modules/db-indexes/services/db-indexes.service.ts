/* eslint-disable no-console */
import { ModelNames } from '@common/constants';
import { OpsRunner } from '@db-ops/classes/ops-runner.class';
import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import chalk from 'chalk';
import { Connection } from 'mongoose';

@Injectable()
export class DbIndexesService extends OpsRunner {
  constructor(@InjectConnection() private readonly connection: Connection) {
    super();
  }

  async run() {
    await this.assertAllModelsExist();
    const indexResults = await this.connection.syncIndexes({
      continueOnError: true,
    });
    console.log(chalk.green('Synced indexes completed.'));
    const droppedIndexes = Object.entries(indexResults).reduce((acc, [modelName, indexResult]) => {
      if (typeof indexResult?.[0] === 'string') {
        acc[modelName] = indexResult;
      }
      return acc;
    }, {});

    console.log(chalk.magenta('Dropped indexes:'));
    console.log(JSON.stringify(droppedIndexes, null, 2));

    const failedIndexes = Object.entries(indexResults).reduce((acc, [modelName, indexResult]) => {
      if (indexResult.codeName) {
        acc[modelName] = indexResult;
      }
      return acc;
    }, {});

    console.log(chalk.red('Failed indexes:'));
    console.log(failedIndexes);

    console.log(
      chalk.red(
        'NOTE: FINDING DROPPED INDEXES WITH NO FAILURES MEAN THAT THE INDEX WAS PROBABLY DROPPED AND RE-CREATED IN THE SAME RUN. THIS IS NOT AN ERROR.',
      ),
    );
    console.log(chalk.red('# IT IS ADVISED YOU CHECK THOSE INDEXES TO CONFIRM THIS OPERATION WAS DONE SUCCESSFULLY.'));
    console.log(chalk.red('# IF YOU ARE SURE THE INDEXES ARE OKAY, YOU CAN IGNORE THIS MESSAGE.'));
    console.log(
      chalk.red(
        '# Dropped Indexes are indexes that existed in the database but were either not found or modified in the codebase.',
      ),
    );
  }

  private async assertAllModelsExist() {
    const mongooseModelNames = this.connection.modelNames();

    const indexedMongooseModelNames = Object.values(mongooseModelNames).reduce((acc, model) => {
      acc[model] = true;
      return acc;
    }, {});

    const missingModels = Object.values(ModelNames).filter((modelName) => !indexedMongooseModelNames[modelName]);

    if (missingModels.length) {
      console.log(
        chalk.red(
          `Missing models: ${missingModels.join(', ')}. Please make sure these models are provided in the app.`,
        ),
      );
      process.exit(1);
    }
  }
}
