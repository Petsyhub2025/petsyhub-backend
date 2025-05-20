import { registerTsProject } from '@nx/js/src/internal';
const cleanupRegisteredPaths = registerTsProject('./tsconfig.base.json');

export default async function globalTeardown() {
  globalThis.terminateTestingContainers();
}

cleanupRegisteredPaths();
