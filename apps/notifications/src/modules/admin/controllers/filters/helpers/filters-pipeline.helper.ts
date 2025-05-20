export function getUserSegmentsFilterPipeline() {
  return [
    {
      $project: {
        _id: 1,
        title: 1,
      },
    },
  ];
}

export function getDynamicLinksFilterPipeline() {
  return [
    {
      $project: {
        _id: 1,
        title: 1,
      },
    },
  ];
}
