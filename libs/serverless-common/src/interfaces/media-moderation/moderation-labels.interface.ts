interface IBaseModerationLabel {
  name: string;
  minConfidenceThreshold: number;
  isFlagged: boolean;
  isSensitiveContent?: boolean;
}

export interface IL1ModerationLabel extends IBaseModerationLabel {
  L2Labels: IL2ModerationLabel[];
}

export interface IL2ModerationLabel extends IBaseModerationLabel {
  L3Labels: IL3ModerationLabel[];
}

export interface IL3ModerationLabel extends IBaseModerationLabel {}
