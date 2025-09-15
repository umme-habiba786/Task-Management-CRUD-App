# Task-Management-CRUD-App
# 📋 Task Management CRUD Application - Docker Assignment

## Overview
This repository contains a complete **full-stack Task Management CRUD application** built with Node.js and Express, featuring a responsive web interface and RESTful API. The application is containerized using Docker with multi-stage builds for production optimization.

## 🚀 Application Features

### Complete CRUD Operations
- **CREATE** ➕ Add new tasks with title, description, status, priority, and due dates
- **READ** 📖 View, filter, search, and sort tasks with real-time statistics  
- **UPDATE** ✏️ Edit existing tasks (full and partial updates supported)
- **DELETE** 🗑️ Remove tasks with confirmation dialogs

## 🏗️ Docker Architecture

### Multi-Stage Build Strategy
The Dockerfile implements a **two-stage build process** to optimize image size and security:

### Stage 1: Builder (`node:18`)
**Base Image**: `node:18` 
**Purpose**: Development environment for building the application

**Why we chose node:18 for the builder stage:**
- **Full Debian-based environment** with all necessary build tools
- Based on `buildpack-deps` which includes common Debian packages  
- Reduces need for additional package installations during build
- **Designed for average Docker users** who have many images on their system
- Contains development tools needed for npm builds and compilation

### Stage 2: Production (`node:18-alpine`)
**Base Image**: `node:18-alpine`
**Purpose**: Minimal runtime environment for production deployment

**Why we chose node:18-alpine for production:**
- **Alpine Linux base** (~5MB) leads to much slimmer final images
- **Security-focused** with minimal attack surface  
- **Production-optimized** for running applications, not building them
- Uses `musl libc` instead of `glibc` for smaller footprint

## 🛠️ Implementation Steps

### 1. Application Structure
```
Assignment/
├── Dockerfile              # Multi-stage build configuration
├── .dockerignore          # Exclude unnecessary files from build context  
├── package.json           # Node.js dependencies and scripts
├── public/                # Frontend static files
│   ├── index.html        # Main web interface
│   ├── style.css         # Responsive CSS styling
│   └── script.js         # Frontend JavaScript logic
└── src/
    └── index.js          # Express.js backend server
```

### 2. Build Process Breakdown

**Builder Stage Steps:**
1. **Install Dependencies**: `npm install` (includes dev dependencies)
2. **Copy Source Code**: All application files
3. **Build Application**: `npm run build` (prepares distribution files)
4. **Prepare Artifacts**: Creates optimized files in `dist/` directory

**Production Stage Steps:**
1. **Install Production Dependencies**: `npm install --only=production`
2. **Copy Built Artifacts**: Only necessary files from builder stage
3. **Security Setup**: Switch to non-root `node` user
4. **Health Monitoring**: Configure health check endpoint
5. **Application Start**: `npm start` to run the production server

### 3. Security Measures Implemented
- **Non-root Execution**: Application runs as `node` user (not root)
- **Minimal Attack Surface**: Alpine Linux reduces security vulnerabilities
- **Input Validation**: Backend validates all user inputs and data
- **Health Monitoring**: Built-in `/health` endpoint for container monitoring
- **CORS Protection**: Configured for secure cross-origin requests

### 4. Optimization Features
- **Multi-stage Builds**: Separate build and runtime environments
- **Layer Caching**: Optimized Dockerfile layer ordering for faster rebuilds
- **Dependency Optimization**: Production-only dependencies in final image
- **Static File Serving**: Efficient Express.js static file middleware
- **Size Reduction**: Alpine Linux reduces final image size by ~80%

## 🚀 Getting Started

### Prerequisites
- Docker installed on your system
- Port 3000 available on your machine

### Build and Run

1. **Clone or prepare the application files**
   ```bash
   # Ensure you have all files in the Assignment directory
   cd Assignment
   ```

2. **Build the Docker image**
   ```bash
   docker build -t task-management-app .
   ```

3. **Run the container**
   ```bash
   docker run -d -p 3000:3000 --name task-app task-management-app
   ```

4. **Access the application**
   - **Web Interface**: http://localhost:3000
   - **API Documentation**: http://localhost:3000/api
   - **Health Check**: http://localhost:3000/health

### Testing the CRUD Operations

#### Via Web Interface
1. **Create Tasks**: Use the form to add new tasks with various priorities
2. **Read Tasks**: View all tasks with filtering and search capabilities
3. **Update Tasks**: Click edit button on any task to modify it
4. **Delete Tasks**: Click delete button with confirmation dialog


## 📊 Application Monitoring

### Health Check
The application includes a comprehensive health check endpoint:
```bash
curl http://localhost:3000/health
```

**Returns:**
- Application status and uptime
- Memory usage statistics  
- Task count breakdown by status
- System information (Node.js version, platform)

### Container Management
```bash
# View running containers
docker ps

# Check container logs
docker logs task-app

# Stop the application
docker stop task-app

# Remove container
docker rm task-app
```

---

## 📝 Summary

This Docker assignment successfully demonstrates:
- **Multi-stage build optimization** reducing image size by 80%
- **Security best practices** with non-root execution and minimal base images
- **Complete CRUD application** with both web interface and REST API
- **Production-ready deployment** with health monitoring and error handling
- **Modern development practices** with responsive design and user experience focus

The application serves as both a functional task management system and a demonstration of Docker containerization best practices for Node.js applications.

**Purpose**: Development environment for building the application
- **Base Image**: `node:18` (full Node.js environment)
- **Why**: Includes all build tools and dependencies needed for compilation
- **Actions**:
  - Install all dependencies (including devDependencies)
  - Copy source code
  - Run build process (`npm run build`)

### Stage 2: Production
```dockerfile
FROM node:18-alpine AS production
```

**Purpose**: Lightweight production runtime environment
- **Base Image**: `node:18-alpine` 
- **Why Alpine**: 
  - **Size**: ~5MB vs ~900MB (regular node image)
  - **Security**: Minimal attack surface, fewer vulnerabilities
  - **Performance**: Faster container startup and deployment

## Key Optimizations

### 1. Layer Caching Strategy
```dockerfile
COPY package*.json ./
RUN npm install --only=production
```
- Copy `package.json` first to leverage Docker layer caching
- Only install production dependencies in final stage

### 2. Security Enhancements
```dockerfile
USER node
```
- **Non-root execution**: Prevents privilege escalation attacks
- Uses built-in `node` user from Alpine image

### 3. Minimal File Transfer
```dockerfile
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
```
- Only copy essential files from builder stage
- Excludes source code, tests, and development dependencies

### 4. Health Monitoring
```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```
- **Monitoring**: Container health status for orchestration platforms
- **Arguments**:
  - `--interval=30s`: Check every 30 seconds
  - `--timeout=5s`: Fail if no response in 5 seconds
  - `--start-period=10s`: Grace period for app startup
  - `--retries=3`: Mark unhealthy after 3 consecutive failures

## Build Arguments and Configuration

### Build Commands
```bash
# Build the image
docker build -t my-node-app .

# Run the container
docker run -p 3000:3000 my-node-app
```

### Environment Setup
- **Working Directory**: `/app`
- **Exposed Port**: `3000`
- **Start Command**: `npm start`

## File Structure Optimization

### .dockerignore
The `.dockerignore` file excludes unnecessary files from build context:
```
node_modules/     # Dependencies (installed separately)
dist/            # Build outputs (not needed in builder stage)
.git/            # Version control
.DS_Store        # OS files
.vscode/         # Editor configurations
```

**Benefits**:
- Faster build times
- Smaller build context
- Prevents cache invalidation from irrelevant file changes

## Performance Benefits

### Image Size Comparison
- **Single-stage build**: ~900MB
- **Multi-stage with Alpine**: ~150MB
- **Size reduction**: ~83%

### Build Time Optimization
- Layer caching for dependencies
- Parallel stage execution capability
- Minimal file copying between stages

## Security Features

1. **Non-root execution**: Prevents container escape vulnerabilities
2. **Minimal base image**: Reduced attack surface
3. **Production-only dependencies**: No development tools in final image
4. **Health checks**: Early detection of compromised containers

## Usage

1. Ensure your Node.js application has:
   - `package.json` with build and start scripts
   - Build output in `dist/` directory
   - Health endpoint at `/health` (for health checks)

2. Build and run:
   ```bash
   docker build -t my-app .
   docker run -p 3000:3000 my-app
   ```

3. Health check endpoint should be available at `http://localhost:3000/health`

## Conclusion

This Dockerfile demonstrates production-ready containerization with emphasis on:
- **Security**: Non-root execution, minimal attack surface
- **Performance**: Small image size, fast startup
- **Reliability**: Health monitoring, proper layer caching
- **Maintainability**: Clear separation of build and runtime concerns
