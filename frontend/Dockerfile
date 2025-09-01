FROM node:18-alpine AS builder

WORKDIR /app

# First copy only package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm install --legacy-peer-deps

# Copy the rest of the files
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy only production files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Install only production dependencies
RUN npm ci --only=production --legacy-peer-deps

EXPOSE 3000
CMD ["npm", "start"]
