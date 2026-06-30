# Security & Monitoring Implementation - Phase 10

This document describes the comprehensive security and monitoring system implemented for the AlignME platform.

## Overview

The security implementation includes four major components:

1. **Permission System** - Role-based access control (RBAC)
2. **Enhanced Validation** - Input validation with security checks
3. **Advanced Logging** - Structured logging and monitoring
4. **Security Monitoring** - Threat detection and response
5. **Error Handling** - Centralized error management

## 1. Permission System (`src/middleware/permissions.ts`)

### Features

- **Role-Based Access Control (RBAC)** with 5 user roles
- **25+ granular permissions** covering all platform features
- **Middleware integration** for route protection
- **Flexible permission checking** with `hasPermission()` and `requirePermission()`

### User Roles

- **GUEST** - Basic read-only access
- **USER** - Standard user capabilities
- **MODERATOR** - Content moderation powers
- **ADMIN** - Administrative functions
- **SUPER_ADMIN** - Full system access

### Key Permissions

```typescript
(-MANAGE_USERS,
  DELETE_USERS,
  VIEW_SENSITIVE_DATA - MODERATE_CONTENT,
  DELETE_CONTENT,
  HANDLE_REPORTS - VIEW_REPORTS,
  GENERATE_REPORTS,
  ACCESS_ANALYTICS - MANAGE_JOBS,
  APPROVE_JOBS - SEND_NOTIFICATIONS,
  BROADCAST_MESSAGES);
```

### Usage Example

```typescript
// Protect routes with specific permissions
app.use('/api/admin', requirePermission(Permission.MANAGE_USERS));

// Check permissions programmatically
if (hasPermission(userRole, Permission.DELETE_CONTENT)) {
  // Allow content deletion
}
```

## 2. Enhanced Validation (`src/middleware/enhanced-validation.ts`)

### Security Features

- **SQL Injection Detection** - Pattern matching for malicious SQL
- **XSS Protection** - HTML sanitization and script detection
- **Command Injection Prevention** - System command filtering
- **Path Traversal Protection** - Directory navigation blocking
- **Rate Limiting** - Per-IP validation request limits

### Validation Categories

- **Security Validators** - Threat detection and blocking
- **Sanitizers** - Input cleaning and normalization
- **Schema Validation** - Zod-based data structure validation
- **Rate Limiting** - Anti-abuse protection

### Built-in Schemas

```typescript
-userRegistrationSchema -
  jobPostingSchema -
  messageSchema -
  reportSchema -
  contentFilterSchema -
  moderationActionSchema;
```

### Usage Example

```typescript
// Apply validation to routes
app.post('/api/users', validateRequest(userRegistrationSchema), handler);

// Manual validation
const result = securityValidators.detectSQLInjection(userInput);
if (result.isThreat) {
  // Handle security threat
}
```

## 3. Advanced Logging (`src/utils/logger.ts`)

### Logging Categories

- **SECURITY** - Authentication, authorization, threats
- **PERFORMANCE** - Response times, system metrics
- **BUSINESS** - User actions, transactions
- **AUDIT** - Administrative actions, compliance
- **SYSTEM** - Application lifecycle, errors

### Features

- **Structured JSON Logging** with metadata
- **Multiple Transport Channels** (file, console)
- **Log Rotation** with size and time limits
- **Performance Metrics** tracking
- **Security Event Monitoring**

### Log Levels & Outputs

- **ERROR** → `logs/error.log` + console
- **WARN/INFO/DEBUG** → `logs/combined.log` + console (dev only)

### Usage Example

```typescript
// Security logging
logger.security({
  type: 'authentication',
  severity: 'high',
  userId: user.id,
  ip: req.ip,
  details: { success: false, reason: 'invalid_password' },
});

// Performance tracking
logger.performance('database_query', { queryTime: 145, recordCount: 50 });

// Business events
logger.business({
  type: 'job_posting',
  userId: user.id,
  entityId: job.id,
  metadata: { title: job.title, salary: job.salary },
});
```

## 4. Security Monitoring (`src/services/securityMonitor.ts`)

### Threat Detection

- **Brute Force Attacks** - Failed login tracking
- **SQL Injection** - Malicious query detection
- **XSS Attempts** - Script injection monitoring
- **Rate Limit Violations** - Traffic spike detection
- **Privilege Escalation** - Unauthorized access attempts

### Features

- **Real-time Threat Detection** with automatic blocking
- **IP Blocking** with manual override capabilities
- **Security Alerts** with severity classification
- **Attack Pattern Analysis** with statistical reporting
- **Automated Response** with configurable thresholds

### Security Thresholds

- **Max Failed Logins**: 5 attempts in 15 minutes → IP block
- **Rate Limit**: 60 requests/minute, 120+ → temporary block
- **Suspicious Activity**: 10 incidents → enhanced monitoring

### Usage Example

```typescript
// Monitor authentication
securityMonitor.monitorAuthentication(req, false, userId);

// Detect threats
const blocked = securityMonitor.detectThreat(req, 'sqlInjection', {
  query: suspiciousQuery,
  userInput: userInput,
});

// Check IP status
if (securityMonitor.isBlocked(req.ip)) {
  return res.status(403).json({ error: 'Access denied' });
}
```

## 5. Error Handling (`src/middleware/errorHandler.ts`)

### Custom Error Classes

- **ValidationError** (400) - Input validation failures
- **AuthenticationError** (401) - Login/token issues
- **AuthorizationError** (403) - Permission denied
- **NotFoundError** (404) - Resource not found
- **RateLimitError** (429) - Request throttling
- **SecurityError** (400) - Security violations

### Features

- **Centralized Error Processing** with consistent responses
- **Security Threat Detection** from error patterns
- **Detailed Logging** with request context
- **Production Safety** - No sensitive data leakage
- **Graceful Shutdown** handling for critical errors

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "errors": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "invalid_string"
        }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/users",
  "requestId": "req_123456789"
}
```

## 6. Security API Routes (`src/routes/security.ts`)

### Available Endpoints

#### GET `/api/security/stats`

- **Permission**: `VIEW_REPORTS`
- **Purpose**: Security statistics and metrics
- **Query Params**: `timeframe` (hour/day/week/month)

#### GET `/api/security/alerts`

- **Permission**: `VIEW_REPORTS`
- **Purpose**: Security alerts with filtering
- **Query Params**: `severity`, `type`, `since`, `limit`, `offset`

#### GET `/api/security/blocked-ips`

- **Permission**: `MODERATE_CONTENT`
- **Purpose**: List of blocked IP addresses

#### POST `/api/security/unblock-ip`

- **Permission**: `MODERATE_CONTENT`
- **Purpose**: Manually unblock IP addresses
- **Body**: `{ ip: string, reason: string }`

#### GET `/api/security/threats`

- **Permission**: `VIEW_REPORTS`
- **Purpose**: Threat detection summary and analysis

#### GET `/api/security/health`

- **Permission**: `VIEW_REPORTS`
- **Purpose**: Security system health check

## 7. Integration with Main Server

### Added Middleware Stack

```typescript
// Security monitoring
app.use(securityMiddleware); // IP blocking, request tracking
app.use(errorBoundary); // Sync error catching

// Route protection
app.use('/api/security', securityRouter);

// Error handling
app.use(notFoundHandler); // 404 handling
app.use(errorHandler); // Centralized error processing
```

### Global Error Handling

- **Uncaught Exceptions** → Logged and graceful shutdown
- **Unhandled Rejections** → Logged and graceful shutdown
- **Route Errors** → Consistent error responses
- **Security Violations** → Automatic threat response

## 8. Security Dashboard Integration

The security routes provide data for a potential security dashboard with:

- **Real-time Threat Monitoring**
- **Security Metrics Visualization**
- **Alert Management Interface**
- **IP Blocking Controls**
- **System Health Indicators**

## 9. Configuration & Environment

### Required Environment Variables

```bash
NODE_ENV=production          # Enables production security features
LOG_LEVEL=info              # Controls log verbosity
MAX_LOG_SIZE=10MB           # Log file rotation size
MAX_LOG_FILES=14            # Number of log files to retain
```

### Security Headers (via Helmet)

- Content Security Policy (CSP)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (HSTS)

## 10. Monitoring & Alerting

### Log Analysis

- **Security Events** → `logs/combined.log`
- **Error Events** → `logs/error.log`
- **Performance Metrics** → Embedded in log entries
- **Audit Trail** → Administrative action logging

### Alert Triggers

- **Critical Security Events** → Immediate blocking + logging
- **High Volume Alerts** → Pattern analysis
- **System Errors** → Application health monitoring

## Best Practices Implemented

1. **Defense in Depth** - Multiple security layers
2. **Principle of Least Privilege** - Minimal required permissions
3. **Fail Secure** - Deny access by default
4. **Input Validation** - All user inputs sanitized
5. **Audit Logging** - Complete activity trail
6. **Incident Response** - Automated threat mitigation
7. **Graceful Degradation** - System stability under attack

## Future Enhancements

1. **External SIEM Integration** - Enterprise security tools
2. **Machine Learning** - Advanced threat detection
3. **Geo-blocking** - Location-based access control
4. **Session Management** - Advanced user session tracking
5. **Compliance Reporting** - GDPR/SOX audit trails

This comprehensive security implementation provides enterprise-grade protection for the AlignME platform while maintaining usability and performance.
