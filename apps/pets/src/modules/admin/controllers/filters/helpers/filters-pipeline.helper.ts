export function getLostPostsFilterPipeline() {
  return [
    {
      $project: {
        _id: 1,
        description: 1,
      },
    },
  ];
}

export function getFoundPostFilterPipeline() {
  return [
    {
      $project: {
        _id: 1,
        description: 1,
      },
    },
  ];
}

export function getPetsFilterOptionsPipeline() {
  return [
    {
      $project: {
        _id: 1,
        name: 1,
      },
    },
  ];
}
