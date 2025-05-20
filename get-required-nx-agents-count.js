// This script is used by the CI workflow using actions/github-script@v7
// to calculate the number of agents required to run the NX Distributed CI based on the number of services, to minimize the execution/billing time.
module.exports = function ({ github, context, core }) {
  const { NX_AFFECTED_SERVICES, NX_AFFECTED_PARALLEL_TASKS } = process.env;

  if (!NX_AFFECTED_SERVICES) {
    throw new Error('[ENV] SERVICES is not defined');
  }

  if (!NX_AFFECTED_PARALLEL_TASKS) {
    throw new Error('[ENV] NX_AFFECTED_PARALLEL_TASKS is not defined');
  }

  if (typeof NX_AFFECTED_SERVICES !== 'string') {
    throw new Error('[ENV] SERVICES is not a string');
  }

  if (isNaN(Number(NX_AFFECTED_PARALLEL_TASKS))) {
    throw new Error('[ENV] NX_AFFECTED_PARALLEL_TASKS is not a number');
  }

  const services = NX_AFFECTED_SERVICES.split(',');
  const nxAffectedParallelTasks = Number(NX_AFFECTED_PARALLEL_TASKS);

  let numberOfAgentsRequired = Math.floor(services.length / nxAffectedParallelTasks);

  if (NX_AFFECTED_SERVICES && services?.length < nxAffectedParallelTasks) {
    numberOfAgentsRequired = 1;
  }

  const matrixAgentsArray = Array(numberOfAgentsRequired)
    .fill(0)
    .map((_, index) => index + 1);

  console.log(`[ENV] SERVICES: ${services}`);
  console.log(`[ENV] NX_AFFECTED_PARALLEL_TASKS: ${nxAffectedParallelTasks}`);
  console.log(`[ENV] NUMBER_OF_AGENTS_REQUIRED: ${numberOfAgentsRequired}`);
  console.log(`[ENV] MATRIX_AGENTS_ARRAY: ${matrixAgentsArray}`);

  core.setOutput('matrix-agents-array', JSON.stringify(matrixAgentsArray));
  core.setOutput('number-of-agents-required', numberOfAgentsRequired);
};
