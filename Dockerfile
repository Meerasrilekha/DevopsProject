# Use a smaller, production-ready Node.js base image
FROM node:20-slim

# Set working directory inside container
WORKDIR /usr/src/app

# Copy package files first for caching
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the app source code
COPY . .

# Exclude unnecessary files to reduce image size
# (Make sure you have a .dockerignore with node_modules, logs, etc.)

# Expose the port your app uses
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
