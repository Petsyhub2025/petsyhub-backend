import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Inject, Injectable } from '@nestjs/common';
import { AWS_SES_CLIENT } from '@common/modules/aws-ses/constants';
import { ISendEmail } from '@common/modules/aws-ses/interfaces/send-email.interface';
import { AppConfig } from '@common/modules/env-config/services/app-config';

@Injectable()
export class AwsSESService {
  constructor(
    @Inject(AWS_SES_CLIENT) private sesClient: SESClient,
    private appConfig: AppConfig,
  ) {}

  async sendEmail({ emails, body, template, subject }: ISendEmail, source: string = 'PetsyHub'): Promise<void> {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: Array.isArray(emails) ? emails : [emails],
      },
      Message: {
        Body: {
          ...(template && {
            Html: {
              Charset: 'UTF-8',
              Data: template,
            },
          }),
          ...(body && {
            Text: {
              Charset: 'UTF-8',
              Data: body,
            },
          }),
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: `${source} <noreply@petsyhub.com>`, //TODO FINISH AWS SES CONFIG FOR NEW DOMAIN
    });

    await this.sesClient.send(command);
  }
}
