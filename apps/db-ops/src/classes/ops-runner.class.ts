import { IOpsRunner } from '@db-ops/interfaces/ops-runner.interface';

export abstract class OpsRunner implements IOpsRunner {
  abstract run(): Promise<void>;
}
