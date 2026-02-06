import seedrandom from "seedrandom";

/** seed for all Math.random calls in app */
export const seed = "mock";

/** seed all Math.random calls in app */
seedrandom(seed, { global: true });
