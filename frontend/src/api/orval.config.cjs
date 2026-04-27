module.exports = {
  meta2onto: {
    output: {
      client: "zod",
      mode: "split",
      target: "./types.ts",
    },
    input: {
      target: "../../../data/schema.yaml",
    },
  },
};
