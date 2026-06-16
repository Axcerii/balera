FROM node:20-slim

# Set the working directory inside the container
WORKDIR /app

# Copy dependency configuration files
COPY package*.json ./

# Install only production dependencies (this will download the correct Linux-specific FFmpeg binary via ffmpeg-static)
RUN npm ci --omit=dev

# Copy the rest of the application files
COPY src ./src

# Run the application
CMD [ "node", "src/index.js" ]
