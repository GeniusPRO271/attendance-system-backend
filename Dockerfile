# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app

# Install dependencies into temp directory
# This will cache them and speed up future builds
FROM base AS install
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Set build arguments for PostgreSQL
ARG POSTGRES_USER
ARG POSTGRES_PASSWORD
ARG POSTGRES_DB

# Set environment variables for PostgreSQL
ENV POSTGRES_USER=$POSTGRES_USER
ENV POSTGRES_PASSWORD=$POSTGRES_PASSWORD
ENV POSTGRES_DB=$POSTGRES_DB

# Construct DATABASE_URL
ENV DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@postgres_education:5432/$POSTGRES_DB

# Copy all project files into the image
FROM base AS dev
COPY --from=install /usr/src/app/node_modules node_modules
COPY . .

# Run the app in development mode
USER bun
EXPOSE 3001
ENTRYPOINT ["bun", "run", "dev"]
