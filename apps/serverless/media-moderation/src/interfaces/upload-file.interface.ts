import { Media } from '@common/schemas/mongoose/common/media/media.type';
import { IProcessedFile } from './processed-file.interface';

export interface IUploadFile {
  s3Key: string;
  processedFile: IProcessedFile;
  media: Media;
  uploadStatus?: 'success' | 'failed';
}
