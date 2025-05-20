export function ProgressBar<T>(context: string, getTotal: (instance: T) => Promise<number>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const total = await getTotal(this);
      let current = 0;

      const updateProgressBar = (current: number, total: number) => {
        const progressBarLength = 40; // Length of the progress bar in characters
        const percentage = current / total;
        const filledBarLength = Math.round(progressBarLength * percentage);
        const emptyBarLength = progressBarLength - filledBarLength;

        const filledBar = '#'.repeat(filledBarLength);
        const emptyBar = '-'.repeat(emptyBarLength);
        const displayPercentage = (percentage * 100).toFixed(2);

        process.stdout.write(`\r${context}: [${filledBar}${emptyBar}] ${displayPercentage}%`);
      };

      const iterator = originalMethod.apply(this, args);

      if (!iterator[Symbol.asyncIterator]) {
        throw new Error('Method must return an async iterator, e.g. an async generator function.');
      }

      for await (const item of iterator) {
        updateProgressBar(++current, total);
      }

      console.log('\n');
    };
    return descriptor;
  };
}
