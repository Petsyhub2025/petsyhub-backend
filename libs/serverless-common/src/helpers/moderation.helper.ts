import { ModerationLabel } from '@aws-sdk/client-rekognition';
import { IModerationResult } from '@serverless/common/interfaces/media-moderation/moderation-result.interface';
import { moderationLabels } from '@serverless/common/constants';

export function transformLabelsToModerationResult(moderationLabels: ModerationLabel[]): IModerationResult {
  let isFlagged = false,
    isSensitiveContent = false;

  for (const label of moderationLabels) {
    const metadata = getModerationLabelMetadata(label);

    if (!metadata) {
      throw new Error(`No metadata found for label: ${label.Name}`);
    }

    isFlagged = label.Confidence >= metadata.minConfidenceThreshold && metadata.isFlagged;
    // If the content is already sensitive once, we don't need to re-set the flag
    isSensitiveContent =
      (label.Confidence >= metadata.minConfidenceThreshold &&
        metadata.isSensitiveContent === true &&
        !metadata.isFlagged) ||
      isSensitiveContent;

    if (isFlagged) {
      break;
    }
  }

  return {
    isSuccess: !isFlagged,
    isSensitiveContent,
  };
}

function getModerationLabelMetadata(moderationLabel: ModerationLabel) {
  for (const label of moderationLabels) {
    const isL1Match = label.name === moderationLabel.Name;
    if (isL1Match) {
      return label;
    }

    if (label.L2Labels?.length) {
      for (const l2Label of label.L2Labels) {
        const isL2Match = l2Label.name === moderationLabel.Name;
        if (isL2Match) {
          return l2Label;
        }

        if (l2Label.L3Labels?.length) {
          for (const l3Label of l2Label.L3Labels) {
            const isL3Match = l3Label.name === moderationLabel.Name;
            if (isL3Match) {
              return l3Label;
            }
          }
        }
      }
    }
  }
}
