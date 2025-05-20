import { PipelineStage } from 'mongoose';

export function getCountriesPipeline(): PipelineStage[] {
  return [
    {
      $project: { _id: 1, name: 1, countryCode: 1, dialCode: 1 },
    },
  ];
}
