export function getUsersFilterOptionsPipeline() {
  return [
    {
      $project: {
        _id: 1,
        firstName: 1,
        lastName: 1,
      },
    },
  ];
}
