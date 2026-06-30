# AlignME Development Dockerfile
# Optimized for development with hot reloading and debugging

FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Create app directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S alignme && \
    adduser -S alignme -u 1001 -G alignme

# Copy package files and install dependencies
COPY --chown=alignme:alignme package*.json ./
COPY --chown=alignme:alignme tsconfig.json ./

# Install all dependencies (including dev dependencies for development)
RUN npm ci && npm cache clean --force

# Copy source code
COPY --chown=alignme:alignme . .

# Change ownership of the app directory
RUN chown -R alignme:alignme /app

# Switch to non-root user
USER alignme

# Create necessary directories
RUN mkdir -p logs coverage uploads

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Expose port
EXPOSE 3000

# Set environment
ENV NODE_ENV=development
ENV PORT=3000

# Start the application with nodemon for hot reloading
CMD ["npm", "run", "dev"]
