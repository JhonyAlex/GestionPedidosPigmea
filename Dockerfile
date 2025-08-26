FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install all dependencies including devDependencies for build
RUN npm install
RUN cd backend && npm install

# Copy source code
COPY . .

# Install devDependencies explicitly if they're missing
RUN npm install --include=dev

# Build the frontend
RUN npm run build

# Copy built frontend to backend's dist directory
RUN cp -r dist backend/

# Expose port
EXPOSE 8080

# Start the backend server
CMD ["node", "backend/index.js"]
ENV PORT=8080

# Start the server
CMD ["node", "index.js"]
