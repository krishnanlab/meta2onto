const schemaLocation = "../../schema.yaml";

module.exports = {
  meta2onto: {
    output: {
      client: "react-query",
      target: "./query.ts",
      baseUrl: "http://localhost:8050",
    },
    input: {
      target: schemaLocation,
    },
  },
};
