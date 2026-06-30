# 🚀 AlignME Deployment & DevOps Guide

This guide covers the complete deployment pipeline, Docker configuration, and CI/CD setup for the AlignME project.

## 📋 Table of Contents
- [Overview](#overview)
- [GitHub Actions CI/CD](#github-actions-cicd)
- [Docker Configuration](#docker-configuration)
- [Deployment Pipeline](#deployment-pipeline)
- [Rollback Procedures](#rollback-procedures)
- [Local Development](#local-development)
- [Production Deployment](#production-deployment)
- [Monitoring & Maintenance](#monitoring--maintenance)

## 🔍 Overview

AlignME uses a comprehensive DevOps pipeline with:
- **Automated Testing**: Unit, integration, and security tests on every PR
- **Docker Containers**: Consistent development and production environments
- **Blue-Green Deployment**: Zero-downtime deployments with automatic rollback
- **Multi-Environment**: Development, staging, and production environments
- **Security**: Vulnerability scanning, code analysis, and security audits

## 🛠️ GitHub Actions CI/CD

### Workflow Files
```
.github/workflows/
├── pr-checks.yml       # Pull request validation
├── ci-cd.yml          # Main deployment pipeline
└── rollback.yml       # Emergency rollback procedures
```

### Pull Request Checks (`pr-checks.yml`)
Automatically runs on every pull request:

#### ✅ Automated Checks:
- **Code Quality**: ESLint, Prettier formatting
- **Type Safety**: TypeScript type checking
- **Security**: Vulnerability scanning, security linting
- **Testing**: Unit tests, integration tests
- **Performance**: Bundle size analysis, load testing
- **Multi-Node**: Tests on Node.js 16, 18, 20

#### 🚀 Quick Commands:
```bash
# Run all PR checks locally
npm run ci:test

# Run security checks
npm run security:scan

# Check code formatting
npm run format:check
```

### Main CI/CD Pipeline (`ci-cd.yml`)
Handles building, testing, and deployment:

#### 🏗️ Build Process:
1. **Code Quality & Testing** - Comprehensive test suite
2. **Docker Build** - Multi-stage production builds
3. **Environment Deployment** - Automated deployment to dev/staging/prod
4. **Health Checks** - Post-deployment verification

#### 🌍 Environment Strategy:
- **`develop` branch** → Development environment
- **`staging` branch** → Staging environment  
- **`main` branch** → Production environment

### Emergency Rollback (`rollback.yml`)
Manual workflow for emergency rollbacks:

#### 🚨 Rollback Features:
- **Pre-rollback Validation** - Ensures rollback target exists
- **Automatic Backup** - Saves current state before rollback
- **Health Verification** - Confirms rollback success
- **Emergency Mode** - Skip health checks for critical issues

#### 🔄 Trigger Rollback:
1. Go to **Actions** tab in GitHub
2. Select **"Deployment Rollback"** workflow
3. Click **"Run workflow"**
4. Fill in:
   - Environment (development/staging/production)
   - Rollback version (optional - defaults to previous)
   - Reason for rollback
   - Skip health checks (emergency only)

## 🐳 Docker Configuration

### Container Images

#### Development (`Dockerfile`)
```dockerfile
# Features:
- Node.js 18 Alpine base
- Non-root user security
- Hot reloading with nodemon
- Debug port exposed (9229)
- Health checks included
```

#### Production (`Dockerfile.production`)
```dockerfile
# Multi-stage build:
- Build stage: TypeScript compilation, optimization
- Production stage: Minimal runtime, security hardening
- Health checks and monitoring
```

### Docker Compose Setup

#### Main Configuration (`docker-compose.yml`)
Complete development environment:
```yaml
services:
  app:          # Main AlignME application
  postgres:     # PostgreSQL database
  redis:        # Redis cache
  pgadmin:      # Database admin UI
  redis-commander:  # Redis admin UI
  prometheus:   # Metrics collection
  grafana:     # Metrics visualization
```

#### Development Override (`docker-compose.override.yml`)
Development-specific configurations:
- Hot reloading
- Debug mode enabled
- Test services
- Development tools

### 🚀 Quick Start with Docker

#### Windows:
```batch
# Start development environment
scripts\docker-dev.bat up

# Start with fresh build
scripts\docker-dev.bat up --build

# View application logs
scripts\docker-dev.bat logs

# Open shell in app container
scripts\docker-dev.bat shell

# Stop environment
scripts\docker-dev.bat down
```

#### Linux/macOS:
```bash
# Start development environment
./scripts/docker-dev.sh up

# Start with fresh build
./scripts/docker-dev.sh up --build

# View application logs  
./scripts/docker-dev.sh logs

# Open shell in app container
./scripts/docker-dev.sh shell

# Stop environment
./scripts/docker-dev.sh down
```

### 🔧 Docker Services Access

Once running, access these services:
- **AlignME App**: http://localhost:3000
- **PgAdmin**: http://localhost:8080 (admin@alignme.com / admin123)
- **Redis Commander**: http://localhost:8081 (with --profile tools)
- **Prometheus**: http://localhost:9090 (with --profile monitoring)
- **Grafana**: http://localhost:3001 (with --profile monitoring)

## 🚀 Deployment Pipeline

### Deployment Strategies

#### Blue-Green Deployment
Zero-downtime deployment method:

1. **Green Environment** - Deploy new version to inactive environment
2. **Health Checks** - Verify new deployment is healthy
3. **Traffic Switch** - Gradually move traffic to new version
4. **Cleanup** - Remove old version after successful deployment

#### Automatic Rollback
If deployment fails:
1. **Detect Failure** - Health checks or verification fails
2. **Immediate Rollback** - Switch traffic back to previous version
3. **Notification** - Alert team of rollback
4. **Investigation** - Create issues for failed deployment

### Environment Configuration

#### Development Environment
```yaml
URL: https://dev.alignme.com
Branch: develop
Auto-deploy: ✅ Yes
Rollback: ✅ Automatic
Health Checks: ✅ Basic
```

#### Staging Environment  
```yaml
URL: https://staging.alignme.com
Branch: staging
Auto-deploy: ✅ Yes (after tests pass)
Rollback: ✅ Automatic
Health Checks: ✅ Comprehensive
```

#### Production Environment
```yaml
URL: https://alignme.com
Branch: main
Auto-deploy: ✅ Yes (with approval)
Rollback: ✅ Automatic + Manual
Health Checks: ✅ Critical path testing
```

## 🔄 Rollback Procedures

### Automatic Rollback Triggers
- Health check failures
- Application startup errors
- Critical path test failures
- High error rates post-deployment

### Manual Rollback Process

#### Emergency Rollback:
1. **Trigger Workflow**:
   ```
   GitHub Actions → Deployment Rollback → Run workflow
   ```

2. **Fill Parameters**:
   - Environment: `production`
   - Rollback version: `(leave empty for previous)`
   - Reason: `Critical production issue`
   - Skip health checks: `☑️ Yes` (emergency only)

3. **Monitor Progress**:
   - Watch workflow execution
   - Check application health
   - Verify rollback success

#### Post-Rollback Actions:
1. **Verify Service** - Confirm application is working
2. **Check Metrics** - Monitor error rates, response times
3. **Investigate Issue** - Debug failed deployment
4. **Notify Team** - Update stakeholders
5. **Plan Fix** - Prepare corrected deployment

### Rollback Validation
Before rollback execution:
- ✅ Target version exists in registry
- ✅ Target version differs from current
- ✅ Database compatibility check
- ✅ Backup of current state created

## 💻 Local Development

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Git

### Development Setup

#### Method 1: Docker (Recommended)
```bash
# Clone repository
git clone <repository-url>
cd AlingME

# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs

# Stop environment
npm run docker:dev:down
```

#### Method 2: Local Installation
```bash
# Install dependencies
npm ci

# Set up environment variables
cp .env.example .env

# Start database (requires Docker)
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Start development server
npm run dev
```

### Development Commands
```bash
# Code quality
npm run lint              # Run ESLint
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
npm run type-check        # TypeScript type checking

# Testing
npm run test              # Run all tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage report

# Database
npm run db:migrate        # Run migrations
npm run db:seed:all       # Seed sample data
npm run db:migrate:undo   # Undo last migration

# Docker shortcuts
npm run docker:dev        # Start dev environment
npm run docker:dev:build  # Start with fresh build
npm run docker:dev:shell  # Open app shell
npm run docker:dev:clean  # Clean up containers
```

## 🏭 Production Deployment

### Production Architecture
```
Load Balancer (ALB)
    ├── Blue Environment (Current)
    └── Green Environment (Deployment)

Database: Amazon RDS PostgreSQL
Cache: Amazon ElastiCache Redis
Storage: Amazon S3
Monitoring: CloudWatch + Prometheus
```

### Deployment Process

#### 1. Pre-deployment
- [ ] Code review and approval
- [ ] All tests passing
- [ ] Security scans clear
- [ ] Database migrations ready
- [ ] Rollback plan confirmed

#### 2. Deployment Steps  
```yaml
1. Build & Test: 
   - Docker image build
   - Security scanning
   - Test suite execution

2. Green Deployment:
   - Deploy to green environment
   - Database migrations (if needed)
   - Health checks

3. Traffic Switch:
   - Gradual traffic migration (25%, 50%, 75%, 100%)
   - Monitor key metrics
   - Automatic rollback on issues

4. Cleanup:
   - Remove blue environment
   - Update monitoring
   - Deployment notifications
```

#### 3. Post-deployment
- [ ] Health checks passing
- [ ] Key metrics stable  
- [ ] Error rates normal
- [ ] Performance baseline met
- [ ] User acceptance verified

### Production Monitoring
```yaml
Health Checks:
  - Application: /health
  - Database: Connection tests
  - Cache: Redis ping
  - External APIs: Status checks

Key Metrics:
  - Response times: < 200ms average
  - Error rates: < 0.1%
  - Memory usage: < 80%
  - CPU usage: < 70%
  - Database connections: < 80% pool
```

## 📊 Monitoring & Maintenance

### Health Endpoints
```yaml
GET /health                    # Basic health check
GET /api/health               # Detailed health status
GET /api/monitoring/metrics   # Prometheus metrics
GET /api/monitoring/performance # Performance data
```

### Log Management
```bash
# View logs locally
npm run logs:view         # Combined logs
npm run logs:errors       # Error logs only
npm run logs:performance  # Performance logs
npm run logs:business     # Business logic logs

# Docker logs
npm run docker:dev:logs   # All container logs
npm run docker:dev:logs app # App container only
```

### Metrics & Monitoring
- **Application Metrics**: Request rates, response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk, network usage
- **Business Metrics**: User registrations, job matches, system usage
- **Security Metrics**: Failed logins, security events, audit logs

### Maintenance Tasks

#### Daily:
- [ ] Check error rates and logs
- [ ] Monitor system performance
- [ ] Verify backup completion
- [ ] Review security alerts

#### Weekly:
- [ ] Update dependencies
- [ ] Run security scans
- [ ] Performance baseline review
- [ ] Capacity planning review

#### Monthly:
- [ ] Disaster recovery testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Infrastructure cost review

## 🔧 Troubleshooting

### Common Issues

#### Deployment Failures:
```yaml
Issue: Health checks failing
Solution: 
  - Check application logs
  - Verify database connectivity
  - Check environment variables
  - Review resource limits

Issue: Database migration errors
Solution:
  - Check migration scripts
  - Verify database permissions
  - Ensure proper sequencing
  - Test on staging first
```

#### Docker Issues:
```yaml
Issue: Container won't start
Solution:
  - Check Docker daemon
  - Review container logs
  - Verify port conflicts
  - Check resource limits

Issue: Database connection errors  
Solution:
  - Verify service dependencies
  - Check network connectivity
  - Review environment variables
  - Confirm database is ready
```

### Emergency Contacts
- **Platform Team**: @oncall/platform
- **DevOps Team**: @oncall/devops  
- **Security Team**: @oncall/security

### Support Resources
- **Documentation**: `/docs`
- **Runbooks**: `/docs/runbooks`
- **Architecture**: `/docs/architecture`
- **API Docs**: `/docs/api`

---

## 📚 Additional Resources

### Related Documentation:
- [Security Implementation Guide](SECURITY_IMPLEMENTATION.md)
- [Database Integration Guide](DATABASE_INTEGRATION_GUIDE.md)
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Monitoring Implementation Guide](MONITORING_IMPLEMENTATION_GUIDE.md)

### External References:
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Node.js Production Guide](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

*This guide is continuously updated. For the latest information, check the repository documentation.*
