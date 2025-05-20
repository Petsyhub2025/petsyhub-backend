import { IL1ModerationLabel } from '@serverless/common/interfaces/media-moderation/moderation-labels.interface';

export const moderationLabels: IL1ModerationLabel[] = [
  {
    name: 'Explicit',
    minConfidenceThreshold: 10,
    isFlagged: false,
    L2Labels: [
      {
        name: 'Explicit Nudity',
        minConfidenceThreshold: 10,
        isFlagged: true,
        L3Labels: [
          { name: 'Exposed Male Genitalia', minConfidenceThreshold: 10, isFlagged: true },
          { name: 'Exposed Female Genitalia', minConfidenceThreshold: 10, isFlagged: true },
          { name: 'Exposed Buttocks or Anus', minConfidenceThreshold: 10, isFlagged: true },
          { name: 'Exposed Female Nipple', minConfidenceThreshold: 10, isFlagged: true },
        ],
      },
      {
        name: 'Explicit Sexual Activity',
        minConfidenceThreshold: 40,
        isFlagged: true,
        L3Labels: [],
      },
      {
        name: 'Sex Toys',
        minConfidenceThreshold: 40,
        isFlagged: true,
        L3Labels: [],
      },
    ],
  },
  {
    name: 'Non-Explicit Nudity of Intimate parts and Kissing',
    minConfidenceThreshold: 10,
    isFlagged: false,
    L2Labels: [
      {
        name: 'Non-Explicit Nudity',
        minConfidenceThreshold: 10,
        isFlagged: false,
        L3Labels: [
          { name: 'Bare Back', minConfidenceThreshold: 10, isFlagged: true },
          { name: 'Exposed Male Nipple', minConfidenceThreshold: 10, isFlagged: false },
          { name: 'Partially Exposed Buttocks', minConfidenceThreshold: 30, isFlagged: true },
          { name: 'Partially Exposed Female Breast', minConfidenceThreshold: 60, isFlagged: true },
          { name: 'Implied Nudity', minConfidenceThreshold: 10, isFlagged: true },
        ],
      },
      {
        name: 'Obstructed Intimate Parts',
        minConfidenceThreshold: 10,
        isFlagged: true,
        L3Labels: [
          { name: 'Obstructed Female Nipple', minConfidenceThreshold: 10, isFlagged: true },
          { name: 'Obstructed Male Genitalia', minConfidenceThreshold: 10, isFlagged: true },
        ],
      },
      {
        name: 'Kissing on the Lips',
        minConfidenceThreshold: 10,
        isFlagged: false,
        L3Labels: [],
      },
    ],
  },
  {
    name: 'Swimwear or Underwear',
    minConfidenceThreshold: 80,
    isFlagged: false,
    L2Labels: [
      {
        name: 'Female Swimwear or Underwear',
        minConfidenceThreshold: 80,
        isFlagged: false,
        L3Labels: [],
      },
      {
        name: 'Male Swimwear or Underwear',
        minConfidenceThreshold: 80,
        isFlagged: false,
        L3Labels: [],
      },
    ],
  },
  {
    name: 'Violence',
    minConfidenceThreshold: 70,
    isFlagged: true,
    L2Labels: [
      {
        name: 'Weapons',
        minConfidenceThreshold: 70,
        isFlagged: true,
        L3Labels: [],
      },
      {
        name: 'Graphic Violence',
        minConfidenceThreshold: 70,
        isFlagged: true,
        isSensitiveContent: true,
        L3Labels: [
          { name: 'Weapon Violence', minConfidenceThreshold: 70, isFlagged: true },
          { name: 'Physical Violence', minConfidenceThreshold: 70, isFlagged: true },
          { name: 'Self-Harm', minConfidenceThreshold: 70, isFlagged: true },
          { name: 'Blood & Gore', minConfidenceThreshold: 70, isFlagged: true },
          { name: 'Explosions and Blasts', minConfidenceThreshold: 70, isFlagged: true },
        ],
      },
    ],
  },
  {
    name: 'Visually Disturbing',
    minConfidenceThreshold: 90,
    isFlagged: false,
    L2Labels: [
      {
        name: 'Death and Emaciation',
        minConfidenceThreshold: 90,
        isFlagged: false,
        isSensitiveContent: true,
        L3Labels: [
          { name: 'Emaciated Bodies', minConfidenceThreshold: 65, isFlagged: false, isSensitiveContent: true },
          { name: 'Corpses', minConfidenceThreshold: 20, isFlagged: true },
        ],
      },
      {
        name: 'Crashes',
        minConfidenceThreshold: 90,
        isFlagged: true,
        L3Labels: [{ name: 'Air Crash', minConfidenceThreshold: 90, isFlagged: true }],
      },
    ],
  },
  {
    name: 'Drugs & Tobacco',
    minConfidenceThreshold: 85,
    isFlagged: false,
    L2Labels: [
      {
        name: 'Products',
        minConfidenceThreshold: 90,
        isFlagged: false,
        L3Labels: [{ name: 'Pills', minConfidenceThreshold: 90, isFlagged: false }],
      },
      {
        name: 'Drugs & Tobacco Paraphernalia & Use',
        minConfidenceThreshold: 90,
        isFlagged: true,
        L3Labels: [{ name: 'Smoking', minConfidenceThreshold: 90, isFlagged: true }],
      },
    ],
  },
  {
    name: 'Alcohol',
    minConfidenceThreshold: 85,
    isFlagged: true,
    L2Labels: [
      {
        name: 'Alcohol Use',
        minConfidenceThreshold: 90,
        isFlagged: true,
        L3Labels: [{ name: 'Drinking', minConfidenceThreshold: 90, isFlagged: true }],
      },
      {
        name: 'Alcoholic Beverages',
        minConfidenceThreshold: 90,
        isFlagged: true,
        L3Labels: [],
      },
    ],
  },
  {
    name: 'Rude Gestures',
    minConfidenceThreshold: 85,
    isFlagged: true,
    L2Labels: [
      {
        name: 'Middle Finger',
        minConfidenceThreshold: 50,
        isFlagged: true,
        L3Labels: [],
      },
    ],
  },
  {
    name: 'Gambling',
    minConfidenceThreshold: 35,
    isFlagged: true,
    L2Labels: [],
  },
  {
    name: 'Hate Symbols',
    minConfidenceThreshold: 90,
    isFlagged: false,
    L2Labels: [
      { name: 'Nazi Party', minConfidenceThreshold: 90, isFlagged: true, L3Labels: [] },
      { name: 'White Supremacy', minConfidenceThreshold: 90, isFlagged: true, L3Labels: [] },
      { name: 'Extremist', minConfidenceThreshold: 90, isFlagged: false, L3Labels: [] },
    ],
  },
];
