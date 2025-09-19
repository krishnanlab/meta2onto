# Use the official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package management files
COPY package.json bun.lock* ./

# Install dependencies using Bun
RUN bun install --frozen-lockfile

# Copy the rest of the application
COPY . .

# Expose the port (commonly 3000 for development servers)
EXPOSE 3000

# Set environment to development for hot-reloading
ENV NODE_ENV=development

# Run the application in development mode with hot-reloading
# Using bun --hot for hot-reloading functionality
CMD ["bun", "--hot", "src/index.ts"]
