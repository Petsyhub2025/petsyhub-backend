export enum ReportStatusEnum {
  PENDING = 'pending',
  ACTIONED = 'actioned',
  REJECTED = 'rejected',
}

export enum ReportReasonEnum {
  DO_NOT_LIKE = `I just don't like it.`,
  SPAM = `It's spam.`,
  NUDITY = 'Nudity or sexual activity.',
  HATE_SPEECH = 'Hate speech or symbols.',
  VIOLENCE = 'Violence or dangerous organizations.',
  BULLYING = 'Bullying or harassment.',
  FALSE_INFORMATION = 'False information.',
  SCAM = 'Scam or fraud.',
  SUICIDE = 'Suicide or self-injury.',
  SALE_OF_ILLEGAL_OR_REGULATED_GOODS = 'Sale of illegal or regulated goods or services.',
  INTELLECTUAL_PROPERTY = 'Intellectual property violation.',
}

export enum ReportTypeEnum {
  POST = 'post',
  COMMENT = 'comment',
  COMMENT_REPLY = 'commentReply',
  USER = 'user',
}
