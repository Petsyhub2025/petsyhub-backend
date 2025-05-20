import { TestingContainersEnum } from '@testing/constants';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';
import { from, interval, lastValueFrom, map, race, take } from 'rxjs';

export async function spinUpTestingContainers(requestedContainers: TestingContainersEnum[]) {
  if (!requestedContainers.length) {
    throw new Error('No containers requested');
  }

  const composeFilePath = path.join(process.cwd(), 'docker-compose.yml'); // It will be assumed to be in the root of the project
  try {
    assertComposeFileExists(composeFilePath);

    const containersToSpinUp = requestedContainers.join(' ');
    const command = `docker-compose -f ${composeFilePath} up -d ${containersToSpinUp}`;

    execSync(command, { timeout: 120000 });

    console.log(chalk.blue('[INFO]: Testing containers started'));
    console.log(chalk.blue('[INFO]: Waiting for containers to be ready...'));

    const timeout$ = interval(20000).pipe(
      take(1),
      map(() => {
        throw new Error('Containers did not start in time');
      }),
      // catchError((error) => {
      //   console.error(error.message);
      //   process.exit(1);
      // }),
    );

    await lastValueFrom(
      race(
        timeout$,
        from(waitForContainersToBeReady(requestedContainers)),
        // .pipe(
        //   catchError((error) => {
        //     console.error(error.message);
        //     process.exit(1);
        //   }),
        // ),
      ),
    );
  } catch (error) {
    console.error(chalk.red('[ERROR]: ' + error?.message));
    await terminateContainers(composeFilePath);
    process.exit(1);
  }

  return terminateContainers.bind(null, composeFilePath);
}

async function terminateContainers(composeFilePath: string) {
  if (process.env.KEEP_CONTAINERS === 'true') {
    console.log(chalk.blue('[INFO]: KEEP_CONTAINERS is set to true. Skipping container termination'));
    return;
  }

  const command = `docker-compose -f ${composeFilePath} down`;

  console.log(chalk.blue('[INFO]: Terminating testing containers...'));

  execSync(command, { timeout: 30000 });

  console.log(chalk.green('[INFO]: Testing containers terminated'));
}

async function waitForContainersToBeReady(requestedContainers: TestingContainersEnum[]) {
  while (!(await checkContainersHealth(requestedContainers))) {
    console.log(chalk.blue('[INFO]: Containers are not yet healthy. Waiting...'));
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log(chalk.green('[INFO]: Containers are ready'));
}

async function checkContainersHealth(requestedContainers: TestingContainersEnum[]) {
  for (const container of requestedContainers) {
    const command = `docker inspect --format='{{.State.Health.Status}}' ${container}`;

    const containerStatus = execSync(command).toString().trim();

    if (containerStatus !== 'healthy') {
      return false;
    }
  }

  return true;
}

function assertComposeFileExists(composeFilePath: string) {
  const fileExists = existsSync(composeFilePath);

  if (!fileExists) {
    throw new Error('docker-compose.yml file does not exist');
  }
}
