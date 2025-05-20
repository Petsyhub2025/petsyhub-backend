import { IsString, Matches } from 'class-validator';

export class GetMediaPreSignedUrlQueryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+\.(jpg|jpeg|png|mp4|pdf|docx|doc|txt|mp3|ogg|wav)$/)
  filename: string;
}

export class GetImageVideoPreSignedUrlQueryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+\.(jpg|jpeg|png|mp4|mov)$/)
  filename: string;
}

export class GetImagePreSignedUrlQueryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+\.(jpg|jpeg|png)$/)
  filename: string;
}

export class GetFilePreSignedUrlQueryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+\.(pdf|docx|doc|txt)$/)
  filename: string;
}

export class GetAudioPreSignedUrlQueryDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9-_]+\.(mp3|ogg|wav)$/)
  filename: string;
}
