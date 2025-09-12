# ============================
# 1. Builder Stage
# ============================
FROM node:18 AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build


# ============================
# 2. Production Stage
# ============================
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Copy only package.json to install prod dependencies
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy built files and necessary code from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# Change ownership and run as non-root user (node user comes with node:alpine)
USER node

# Expose app port
EXPOSE 3000

# Optional Healthcheck (bonus) - using wget for Alpine compatibility
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the app
CMD ["npm", "start"]

