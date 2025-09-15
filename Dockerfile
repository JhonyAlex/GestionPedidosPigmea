FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Install missing Vite dependencies explicitly
RUN npm install @vitejs/plugin-react vite terser --save-dev

# Build the frontend (aplicación principal)
RUN npm run build

# Install psql client for migrations
RUN apk add --no-cache postgresql-client

# Copy entrypoint and migration scripts
COPY backend/run-migrations.sh backend/run-migrations.sh
COPY backend/docker-entrypoint.sh backend/docker-entrypoint.sh

# Make scripts executable
RUN chmod +x backend/run-migrations.sh
RUN chmod +x backend/docker-entrypoint.sh

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080

# Set the entrypoint to our custom script
ENTRYPOINT ["/app/backend/docker-entrypoint.sh"]
