export const sleep = (duration: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(), duration);
  });
