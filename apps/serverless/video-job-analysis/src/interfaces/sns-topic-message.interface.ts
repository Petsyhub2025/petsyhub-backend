export interface ISnsMessage {
  Type?: string;
  MessageId?: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp?: string;
  SignatureVersion?: string;
  Signature?: string;
  SigningCertUrl?: string;
  UnsubscribeUrl?: string;
  MessageAttributes?: Record<string, any>;
}

export interface IMessageRecord {
  EventSource?: string;
  EventVersion?: string;
  EventSubscriptionArn?: string;
  Sns: ISnsMessage;
}

export interface ISnsTopicMessage {
  Records: IMessageRecord[];
}
