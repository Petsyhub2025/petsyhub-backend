import { registerTsProject } from '@nx/js/src/internal';
const cleanupRegisteredPaths = registerTsProject('./tsconfig.base.json');
import { TestingContainersEnum, spinUpTestingContainers } from '@instapets-backend/testing';

export default async function globalSetup() {
  globalThis.terminateTestingContainers = await spinUpTestingContainers([
    TestingContainersEnum.REDIS,
    TestingContainersEnum.RABBIT_MQ,
    TestingContainersEnum.MONGO_DB,
  ]);
}

cleanupRegisteredPaths();
