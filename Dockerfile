FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY admin/package*.json ./admin/

# Install dependencies
RUN npm install
RUN cd backend && npm install
RUN cd admin && npm install

# Copy source code
COPY . .

# Install missing Vite dependencies explicitly
RUN npm install @vitejs/plugin-react vite terser --save-dev

# Build the frontend (aplicación principal)
RUN npm run build

# Build the admin panel
RUN cd admin && npm run build

# Copy built frontend to backend's dist directory
RUN cp -r dist backend/

# Copy built admin panel to backend's admin directory
RUN cp -r admin/dist backend/admin

# Expose port
EXPOSE 8080

# Set environment
ENV PORT=8080

# Start the backend server
CMD ["node", "backend/index.js"]
