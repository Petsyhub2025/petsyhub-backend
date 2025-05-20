import { CognitoIdentityClient, GetOpenIdTokenForDeveloperIdentityCommand } from '@aws-sdk/client-cognito-identity';
import {
  AWS_COGNITO_CLIENT,
  AWS_COGNITO_IDENTITY_TOKEN_DURATION,
  AWS_COGNITO_MODULE_OPTIONS,
} from '@common/modules/aws-cognito/constants';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { AwsCognitoModuleOptions } from '@common/modules/aws-cognito/interfaces';

@Injectable()
export class AwsCognitoService {
  private logger = new Logger('AwsCognitoService');
  constructor(
    @Inject(AWS_COGNITO_CLIENT) private cognitoIdentityClient: CognitoIdentityClient,
    @Inject(AWS_COGNITO_MODULE_OPTIONS) private options: AwsCognitoModuleOptions,
  ) {}

  getCognitoIdentityConfig() {
    return {
      region: this.options.region,
      identityPoolId: this.options.identityPoolId,
    };
  }

  async getOpenIdTokenForDeveloperIdentity(id: string) {
    try {
      const command = new GetOpenIdTokenForDeveloperIdentityCommand({
        IdentityPoolId: this.options.identityPoolId,
        Logins: {
          [this.options.developerIdentityId]: id,
        },
        TokenDuration: AWS_COGNITO_IDENTITY_TOKEN_DURATION,
      });

      const response = await this.cognitoIdentityClient.send(command);

      if (!response?.Token) {
        throw new Error('No token received');
      }

      const { IdentityId, Token } = response;

      return {
        identityId: IdentityId,
        cognitoToken: Token,
      };
    } catch (error) {
      this.logger.error('Error in getOpenIdTokenForDeveloperIdentity', { error, id });
      return null;
    }
  }
}
