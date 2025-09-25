/** wait ms */
export const sleep = async (ms = 0) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

/** wait for func to return, checking periodically */
export const waitFor = async <Return>(
  func: () => Return,
): Promise<Return | undefined> => {
  const waits = [
    0, 1, 5, 10, 20, 30, 40, 50, 100, 200, 300, 400, 500, 1000, 2000, 3000,
  ];
  while (waits.length) {
    const result = func();
    if (result !== undefined && result !== null) return result;
    await sleep(waits.shift());
  }
};
