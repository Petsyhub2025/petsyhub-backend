export function getMsgHandlerBaseUrl() {
  const baseUrl =
    process.env.NODE_ENV === 'dev'
      ? 'https://api.petsy-dev.space'
      : process.env.NODE_ENV === 'tst'
        ? 'https://api.petsy-tst.space'
        : process.env.NODE_ENV === 'prod'
          ? 'https://api.petsy.world'
          : null;

  if (!baseUrl) {
    throw new Error('Invalid environment');
  }

  return baseUrl;
}
