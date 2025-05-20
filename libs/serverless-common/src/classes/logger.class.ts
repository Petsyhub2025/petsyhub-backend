import logDNA from '@logdna/logger';

class LoggerOptions {
  hostname: string;
}

export class Logger {
  private static instance: Logger;
  private logger: logDNA.Logger;
  private colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  };

  private constructor(options: logDNA.ConstructorOptions) {
    this.logger = logDNA.createLogger(process.env.LOGDNA_KEY, options);
  }

  public static initialize(options: LoggerOptions) {
    if (Logger.instance) {
      return;
    }

    const { hostname } = options;

    const appName = `instapets-${process.env.NODE_ENV}-backend`;

    Logger.instance = new Logger({
      hostname: `${appName}-serverless-${hostname}`,
      app: appName,
      env: process.env.NODE_ENV,
      indexMeta: true,
      levels: ['debug', 'info', 'warn', 'error', 'verbose'],
    });
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      throw new Error('Logger not initialized');
    }

    return Logger.instance;
  }

  log(message: string, metadata?: object) {
    console.log(message, metadata);
    this._log({ level: 'info', message: this.colorMessage(message, 'green'), metadata });
  }

  warn(message: string, metadata?: object) {
    console.warn(message, metadata);
    this._log({ level: 'warn', message: this.colorMessage(message, 'yellow'), metadata });
  }

  error(message: string, metadata?: object) {
    console.error(message, metadata);
    this._log({ level: 'error', message: this.colorMessage(message, 'red'), metadata });
  }

  private _log({ level, message, metadata }) {
    this.logger.log(message, { level, ...(!!metadata && { meta: metadata }) });
  }

  private colorMessage(message: string, color: keyof Logger['colors']) {
    return `${this.colors[color]}${message}${this.colors.reset}`;
  }
}
