
FROM node:20-slim

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start the app
CMD ["npm", "run", "dev"]
