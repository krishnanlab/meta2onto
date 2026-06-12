// fetch the location of the schema.yaml file from the environment variable
// if unspecified, defaults to a path that will work when the frontend is run on the host rather than in a container
// (the docker-compose.yml specifies the container-specific path for the file)
const schemaLocation = process.env.VITE_SCHEMA_LOCATION || "../../../data/schema.yaml";

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
