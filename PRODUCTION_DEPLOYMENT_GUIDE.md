# AlignME Production Deployment Guide

# Complete deployment documentation and scripts

## 📋 Production Deployment Checklist

### Prerequisites

- [ ] AWS Account with appropriate permissions
- [ ] Domain name configured (alignme.com)
- [ ] SSL certificates obtained
- [ ] Database backups verified
- [ ] Environment secrets configured in AWS Secrets Manager
- [ ] Monitoring systems configured (Sentry, New Relic)

### Infrastructure Setup

- [ ] ECS Cluster created (`alignme-prod-cluster`)
- [ ] RDS PostgreSQL instance configured
- [ ] ElastiCache Redis cluster configured
- [ ] Application Load Balancer configured
- [ ] CloudFront CDN configured
- [ ] Route 53 DNS configured
- [ ] VPC and security groups configured

### Security Configuration

- [ ] WAF rules configured
- [ ] Security groups locked down
- [ ] IAM roles and policies configured
- [ ] Secrets rotated
- [ ] SSL/TLS certificates installed
- [ ] HTTPS enforcement enabled

## 🚀 Deployment Process

### 1. Environment Configuration

```bash
# Copy environment files
cp .env.production .env
cp config/security.json config/security.production.json

# Validate configuration
npm run config:validate

# Test database migrations
npm run db:migrate:check
```

### 2. Build and Test

```bash
# Run full test suite
npm run test:all

# Build production assets
npm run build

# Security audit
npm run security:audit

# Performance test
npm run test:performance
```

### 3. Container Build

```bash
# Build production container
docker build -f Dockerfile.production -t alignme:latest .

# Test container locally
docker-compose -f docker-compose.production.yml up --build

# Push to registry
docker tag alignme:latest ghcr.io/alignme/platform:latest
docker push ghcr.io/alignme/platform:latest
```

### 4. Database Migration

```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run db:migrate

# Verify migration
npm run db:verify
```

### 5. Deploy to ECS

```bash
# Update task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Update service
aws ecs update-service \
  --cluster alignme-prod-cluster \
  --service alignme-prod-service \
  --task-definition alignme-prod:LATEST \
  --force-new-deployment

# Wait for deployment
aws ecs wait services-stable \
  --cluster alignme-prod-cluster \
  --services alignme-prod-service
```

### 6. Post-Deployment Verification

```bash
# Health checks
curl -f https://alignme.com/health

# API tests
npm run test:api:production

# Performance monitoring
npm run monitor:start

# Log monitoring
npm run logs:tail
```

## 🔧 Configuration Files

### AWS Task Definition

```json
{
  "family": "alignme-prod",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/AlignMETaskRole",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/AlignMEExecutionRole",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "containerDefinitions": [
    {
      "name": "alignme-app",
      "image": "ghcr.io/alignme/platform:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DB_PASSWORD",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:ACCOUNT:secret:alignme/prod/db-password"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/aws/ecs/alignme-prod",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

## 📊 Monitoring and Alerting

### CloudWatch Alarms

- CPU Utilization > 80%
- Memory Utilization > 85%
- HTTP 5xx Errors > 10/minute
- Response Time > 2 seconds
- Database Connection Errors

### Custom Metrics

- Active WebSocket Connections
- Job Application Success Rate
- User Registration Rate
- Message Delivery Success Rate

### Log Aggregation

- Application logs → CloudWatch Logs
- Access logs → S3 → Athena for analysis
- Error logs → Sentry for alerting

## 🔄 Rollback Procedures

### Automatic Rollback Triggers

- Health check failures for 5 minutes
- Error rate > 5% for 2 minutes
- Response time > 5 seconds for 3 minutes

### Manual Rollback

```bash
# Get previous task definition
PREVIOUS_TASK_DEF=$(aws ssm get-parameter \
  --name "/alignme/production/rollback/previous-task-def" \
  --query 'Parameter.Value' \
  --output text)

# Rollback service
aws ecs update-service \
  --cluster alignme-prod-cluster \
  --service alignme-prod-service \
  --task-definition $PREVIOUS_TASK_DEF

# Verify rollback
aws ecs wait services-stable \
  --cluster alignme-prod-cluster \
  --services alignme-prod-service
```

## 🔐 Security Checklist

### Infrastructure Security

- [ ] VPC with private subnets
- [ ] NAT Gateway for outbound traffic
- [ ] Security groups with minimal permissions
- [ ] WAF with common attack protection
- [ ] DDoS protection enabled
- [ ] Regular security scanning

### Application Security

- [ ] All secrets in AWS Secrets Manager
- [ ] HTTPS enforced everywhere
- [ ] Security headers configured
- [ ] Input validation and sanitization
- [ ] Rate limiting implemented
- [ ] CSRF protection enabled

### Data Security

- [ ] Database encryption at rest
- [ ] Database encryption in transit
- [ ] Regular automated backups
- [ ] Backup encryption
- [ ] PII data masking in logs
- [ ] GDPR compliance measures

## 🎯 Performance Optimization

### Caching Strategy

- Redis for session storage
- Application-level caching for API responses
- CloudFront CDN for static assets
- Database query optimization

### Scaling Configuration

- Auto Scaling based on CPU/Memory
- Load balancer health checks
- Connection pooling for database
- WebSocket sticky sessions

## 📞 Emergency Contacts

### Incident Response Team

- Primary: tech@alignme.com
- Secondary: admin@alignme.com
- Emergency: +1-XXX-XXX-XXXX

### Escalation Procedures

1. Immediate alert → On-call engineer
2. 15 minutes → Team lead
3. 30 minutes → CTO
4. 1 hour → Executive team

## 📈 Success Metrics

### Performance Targets

- Response time < 500ms (95th percentile)
- Uptime > 99.9%
- Error rate < 0.1%
- Database queries < 100ms

### Business Metrics

- User registration rate
- Job application success rate
- Message delivery success rate
- User engagement metrics

---

_Last updated: $(date)_
_Version: 1.0.0_
_Environment: Production_
