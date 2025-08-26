FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies with clean cache
RUN npm ci --include=dev
RUN cd backend && npm ci

# Copy source code
COPY . .

# Install missing Vite dependencies explicitly
RUN npm install @vitejs/plugin-react vite --save-dev

# Build the frontend
RUN npm run build

# Copy built frontend to backend's dist directory
RUN cp -r dist backend/

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080

# Start the backend server
CMD ["node", "backend/index.js"]
CMD ["node", "index.js"]
