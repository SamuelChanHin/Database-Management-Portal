FROM node:20-alpine

# Install database CLI tools
RUN apk add --no-cache \
    postgresql-client \
    mysql-client \
    sqlite

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Create data directory
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["npm", "start"]
