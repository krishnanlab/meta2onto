# Use the official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package management files
COPY frontend/package.json ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application
COPY frontend/. .

# Copy the Open API schema file
COPY data/schema.yaml .

# Generate frontend types from the schema
RUN bun run schema

# Format the generated types
RUN bun run format
