export interface IJobCompletionVideo {
  S3ObjectName?: string;
  S3Bucket?: string;
}

export interface IJobCompletionEvent {
  JobId: string;
  Status: string;
  API?: string;
  Timestamp?: number;
  Video?: IJobCompletionVideo;
}
