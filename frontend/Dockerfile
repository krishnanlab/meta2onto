# Use the official Bun image as base
FROM oven/bun:1 AS base

# Set working directory
WORKDIR /app

# Copy package management files
COPY package.json bun.lock ./

# Install dependencies using Bun
RUN bun install

# Copy the rest of the application
COPY . .
