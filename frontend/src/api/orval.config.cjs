const schemaLocation = process.env.VITE_SCHEMA_LOCATION;

module.exports = {
  meta2onto: {
    output: {
      client: "zod",
      mode: "split",
      target: "./types.ts",
    },
    input: {
      target: schemaLocation,
    },
  },
};
