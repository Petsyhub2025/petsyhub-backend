import { RpcResponse, ListenerError } from '@common/classes/rabbitmq';
import { EnvironmentEnum } from '@common/enums';
import {
  UserJwtPersona,
  AdminJwtPersona,
  ServiceProviderJwtPersona,
  CustomerJwtPersona,
} from '@common/interfaces/jwt-persona';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import logDNA from '@logdna/logger';
import { ConsoleLogger, Inject, Injectable, Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import { Request } from 'express';
import os from 'os';
import { Logger as WinstonLogger, createLogger, format, transports } from 'winston';
import Transport from 'winston-transport';

@Injectable({ scope: Scope.TRANSIENT })
export class CustomLoggerService extends ConsoleLogger {
  private localeStringOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    day: '2-digit',
    month: '2-digit',
  };

  private colorizer = format.colorize({ all: true });
  private customFormat = (isColored = false) =>
    format.combine(
      format.timestamp(),
      format.json(),
      format.prettyPrint(),
      ...(isColored ? [this.colorizer] : []),
      format.printf(({ timestamp, level, message }) => {
        const formattedPID = `[Nest] ${process.pid}  - `;
        const formattedDate = new Date(timestamp).toLocaleString(undefined, this.localeStringOptions);

        return `${this.colorizer.colorize(this.decolorize(level), formattedPID)}${formattedDate}    ${level} [${
          this.context
        }] ${message}`;
      }),
    );

  private winstonInstance: WinstonLogger;

  constructor(
    @Inject(INQUIRER) private parentClass: object,
    private appConfig: AppConfig,
  ) {
    super();

    this.setContext(this.parentClass?.constructor?.name);
    const appName = `instapets-${this.appConfig.NODE_ENV}-backend`;
    const serviceName = `${appName}-${this.appConfig.APP_SHORT_NAME}`;

    const interfaces = os.networkInterfaces();
    const firstInterface = Object.values(interfaces)
      .flat()
      .find((i) => i?.mac && !i.internal);

    const logger = logDNA.createLogger(this.appConfig.LOGDNA_KEY, {
      hostname: serviceName,
      mac: firstInterface?.mac || '00:00:00:00:00:00',
      ip: firstInterface?.address || '127.0.0.1',
      app: appName,
      env: this.appConfig.NODE_ENV,
      indexMeta: true,
      levels: ['debug', 'info', 'warn', 'error', 'verbose'],
    });

    this.winstonInstance = createLogger({
      exitOnError: false,
      format: this.customFormat(true),
      transports: [
        new transports.Console(),
        ...(this.appConfig.NODE_ENV !== EnvironmentEnum.LOCAL
          ? [
              new Transport({
                log: ({ message, level, metadata }, callback) => {
                  logger.log(message, { level: this.decolorize(level), ...(!!metadata && { meta: metadata }) });
                  callback();
                },
              }),
            ]
          : []),
      ],
      levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4 },
    });
  }

  log(message: any, optionalParams?: any) {
    this.winstonInstance.log('info', message, {
      metadata: {
        context: this.context,
        ...this.formatMetadata(optionalParams),
      },
    });
  }

  error(message: any, optionalParams?: any) {
    let errorMessage = message;
    const isRpcResponse = message instanceof RpcResponse;
    const isListenerError = message instanceof ListenerError;

    if (isRpcResponse) {
      errorMessage = (message as RpcResponse)?.error?.message || 'Unknown Rpc Error';
    }

    if (isListenerError) {
      errorMessage = (message as ListenerError)?.message || 'Unknown Listener Error';
    }

    this.winstonInstance.log('error', errorMessage, {
      metadata: {
        context: this.context,
        ...this.formatMetadata(optionalParams),
        ...((isRpcResponse || isListenerError) && { error: message }),
      },
    });
  }

  warn(message: any, optionalParams?: any) {
    this.winstonInstance.log('warn', message, {
      metadata: {
        context: this.context,
        ...this.formatMetadata(optionalParams),
      },
    });
  }

  debug(message: any, optionalParams?: any) {
    this.winstonInstance.log('debug', message, {
      metadata: {
        context: this.context,
        ...this.formatMetadata(optionalParams),
      },
    });
  }

  verbose(message: any, optionalParams?: any) {
    this.winstonInstance.log('verbose', message, {
      metadata: {
        context: this.context,
        ...this.formatMetadata(optionalParams),
      },
    });
  }

  generateLogMessage(req: Request, resStatusCode: number) {
    const { method, url, persona } = req;

    const personaWithRole = this.getPersonaWithRole(persona);

    return `${personaWithRole} hit ${method} ${url} with status code ${resStatusCode}`;
  }

  getPersonaWithRole(persona: UserJwtPersona | AdminJwtPersona | ServiceProviderJwtPersona | CustomerJwtPersona) {
    const role = this.getRole(persona);

    if (this.isPersonaUser(persona)) {
      return `${role} ${persona.username}`;
    } else if (this.isPersonaAdmin(persona)) {
      return `${role} ${persona.firstName} ${persona.lastName}`;
    } else if (this.isPersonaServiceProvider(persona)) {
      return `${role} ${persona.email}`;
    } else if (this.isPersonaCustomer(persona)) {
      return `${role} ${persona._id}`;
    } else {
      return '(Unknown Persona)';
    }
  }

  getRole(persona: UserJwtPersona | AdminJwtPersona | ServiceProviderJwtPersona | CustomerJwtPersona) {
    if (this.isPersonaUser(persona)) {
      return 'user';
    } else if (this.isPersonaAdmin(persona)) {
      return 'admin';
    } else if (this.isPersonaServiceProvider(persona)) {
      return 'service provider';
    } else if (this.isPersonaCustomer(persona)) {
      return 'customer';
    } else {
      return 'unknown';
    }
  }

  private formatMetadata(metadata: any) {
    const isMetadataStringOrNumber = metadata && (typeof metadata === 'string' || typeof metadata === 'number');

    return isMetadataStringOrNumber ? { metadata: { message: metadata } } : { ...metadata };
  }

  private isPersonaUser(persona: any): persona is UserJwtPersona {
    return !!persona?.username;
  }

  private isPersonaAdmin(persona: any): persona is AdminJwtPersona {
    return !!persona?.permissions;
  }

  private isPersonaServiceProvider(persona: any): persona is ServiceProviderJwtPersona {
    return !!persona?.email;
  }

  private isPersonaCustomer(persona: any): persona is CustomerJwtPersona {
    return !!persona?._id;
  }

  private decolorize(message: string) {
    return message.replace(
      new RegExp(
        [
          '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
          '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
        ].join('|'),
        'g',
      ),
      '',
    );
  }
}
