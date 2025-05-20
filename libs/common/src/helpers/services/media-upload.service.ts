import { CustomError } from '@common/classes/custom-error.class';
import { WsCustomError } from '@common/classes/ws';
import { AwsLambdaService } from '@common/modules/aws-lambda/services';
import { CustomLoggerService } from '@common/modules/common/services/logger';
import { AppConfig } from '@common/modules/env-config/services/app-config';
import { MediaTypeEnum } from '@common/schemas/mongoose/common/media';
import { Injectable, InternalServerErrorException, UnprocessableEntityException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { MediaModerationLambdaEvent } from '@serverless/common/classes/validations/media-moderation-lambda-event.class';
import { IMediaModerationResponse } from '@serverless/common/interfaces/media-moderation/media-moderation-response.interface';

@Injectable()
export class MediaUploadService {
  constructor(
    private readonly appConfig: AppConfig,
    private readonly logger: CustomLoggerService,
    private readonly awsLambdaService: AwsLambdaService,
  ) {}

  public async handleMediaUploads(_options: MediaModerationLambdaEvent, isSocket = false) {
    const defaultOptions: Partial<MediaModerationLambdaEvent> = {
      isUploadedByAdmin: false,
      allowedMediaTypes: [MediaTypeEnum.IMAGE],
    };

    const options = {
      ...defaultOptions,
      ..._options,
    };

    const response = await this.awsLambdaService.invokeLambdaFunction<IMediaModerationResponse>(
      this.appConfig.AWS_LAMBDA_MEDIA_MODERATION_FUNCTION_NAME,
      options,
    );

    if (!response) {
      if (isSocket) throw new WsException(new WsCustomError({ ...this.getLocalizedMediaProcessingErrorMessage() }));
      else
        throw new InternalServerErrorException(
          new CustomError({ ...this.getLocalizedMediaProcessingErrorMessage(), event: 'MEDIA_PROCESSING_ERROR' }),
        );
    }

    if (response.status === 'error') {
      this.logger.error(`Error processing media uploads: ${response?.message}`, {
        response,
        options,
        error: response?.error,
      });

      if (isSocket)
        throw new WsException(new WsCustomError({ ...this.getLocalizedMediaUploadErrorMessage(response?.message) }));
      else
        throw new UnprocessableEntityException(
          new CustomError({
            ...this.getLocalizedMediaUploadErrorMessage(response?.message),
            event: 'MEDIA_UPLOAD_ERROR',
          }),
        );
    }

    const { data } = response;

    return {
      media: data.mediaFiles,
      mediaProcessingId: data.mediaProcessingId,
    };
  }

  private getLocalizedMediaUploadErrorMessage(extraMessage?: string) {
    return {
      localizedMessage: {
        en: `Uploaded Media is invalid or violates the rules. ${extraMessage || ''}`,
        ar: `الوسائط المرفوعة غير صالحة أو تنتهك القواعد. ${extraMessage || ''}`,
      },
    };
  }

  private getLocalizedMediaProcessingErrorMessage() {
    return {
      localizedMessage: {
        en: 'Error processing media uploads',
        ar: 'حدث خطأ أثناء معالجة تحميلات الوسائط',
      },
    };
  }
}
