# AlignME Enhanced Logging and Performance Monitoring Implementation Guide

## 🎯 Overview

This implementation provides a comprehensive logging and performance monitoring solution for the AlignME project with the following features:

### ✅ Winston Logger with Different Log Levels and Transport Configurations
- **Multiple Log Levels**: error, warn, info, http, debug, verbose, performance, business
- **Multiple Transports**: Console, File (error.log, security.log, performance.log, http.log, business.log, audit.log, combined.log)
- **Structured Logging**: JSON format with metadata, timestamps, and correlation IDs
- **Automatic Log Rotation**: File size limits and retention policies
- **Categorized Logging**: Security, Performance, Business, System, Audit categories

### ✅ Request Logging Middleware with Correlation IDs
- **Unique Correlation IDs**: Generated for each request for tracing
- **Comprehensive Request Data**: Method, URL, status, response time, IP, user agent
- **Business Context Logging**: Automatic detection of business events (login, job posting, applications)
- **Security Event Logging**: Automatic detection of unauthorized access, validation failures
- **Performance Tracking**: Slow request detection and alerting

### ✅ Application Performance Monitoring with Metrics Collection
- **System Metrics**: Memory, CPU, disk usage, uptime monitoring
- **Application Metrics**: Request counts, error rates, response times
- **Performance Alerts**: Configurable thresholds for memory, CPU, response time, error rate
- **Health Checks**: Continuous health status monitoring
- **Metrics Aggregation**: Hourly, daily, weekly data aggregation
- **Historical Data**: Retention and cleanup policies

## 🚀 Implementation Files

### Core Components

1. **Enhanced Logger (`src/utils/enhanced-logger.js`)**
   - Winston logger with multiple transports
   - Custom log levels and colors
   - Correlation ID support
   - Structured logging formats

2. **Request Logging Middleware (`src/middleware/request-logging.js`)**
   - Correlation ID generation and tracking
   - Request/response logging with business context
   - Morgan integration for HTTP logging
   - Error logging middleware

3. **Performance Monitoring (`src/middleware/performance-monitoring.js`)**
   - System metrics collection
   - Application performance tracking
   - Alert system with configurable thresholds
   - Health status monitoring

4. **Metrics Service (`src/services/metrics.js`)**
   - Counters, gauges, histograms, timers, sets
   - Business metrics tracking
   - Historical data aggregation
   - Persistence and cleanup

5. **Monitoring API Routes (`src/routes/monitoring.js`)**
   - Health check endpoints
   - Metrics retrieval APIs
   - Performance statistics
   - Alert management

6. **Monitoring Configuration (`src/config/monitoring.js`)**
   - Centralized configuration
   - Service initialization
   - Graceful shutdown handling

7. **Enhanced Server (`server-enhanced.js`)**
   - Integrated monitoring setup
   - Comprehensive error handling
   - Startup and shutdown logging

## 📋 Usage Instructions

### 1. Install Dependencies
All required dependencies are already included in your package.json:
```bash
npm install
```

### 2. Environment Configuration
Add these optional environment variables to your `.env` file:
```env
LOG_LEVEL=info
NODE_ENV=development
```

### 3. Replace Your Server File
Replace your current `server.js` with the new enhanced version:
```bash
# Backup your current server
mv server.js server-backup.js

# Use the new enhanced server
mv server-enhanced.js server.js
```

### 4. Start the Server
```bash
npm start
```

## 🔍 Monitoring Endpoints

### Health and Status
- `GET /health` - Basic health check
- `GET /api/monitoring/health` - Detailed health status
- `GET /api/monitoring/system` - System metrics

### Metrics and Performance
- `GET /api/monitoring/metrics` - Current metrics summary
- `GET /api/monitoring/performance` - Performance statistics
- `GET /api/monitoring/metrics/historical` - Historical data

### Alerts and Logs
- `GET /api/monitoring/alerts` - Active alerts
- `POST /api/monitoring/alerts/{alertId}/acknowledge` - Acknowledge alerts
- `GET /api/monitoring/logs` - Log entries (placeholder)

### Testing (Development Only)
- `POST /api/monitoring/test/log-levels` - Test all log levels
- `POST /api/monitoring/test/performance` - Performance testing

## 📊 Log Files Structure

Logs are automatically organized in the `logs/` directory:

```
logs/
├── combined.log        # All log entries
├── error.log          # Error level logs only
├── security.log       # Security events
├── performance.log    # Performance metrics
├── http.log           # HTTP request logs
├── business.log       # Business events
├── audit.log          # Audit trail
├── exceptions.log     # Uncaught exceptions
├── rejections.log     # Unhandled promise rejections
└── metrics.json       # Metrics persistence
```

## 🎨 Log Levels and Categories

### Log Levels (Priority Order)
1. **error** - Critical errors requiring immediate attention
2. **warn** - Warning conditions
3. **info** - General information
4. **http** - HTTP request/response logs
5. **debug** - Debug information
6. **verbose** - Verbose logging
7. **performance** - Performance metrics
8. **business** - Business events

### Log Categories
- **SYSTEM** - System and application logs
- **SECURITY** - Security events and violations
- **PERFORMANCE** - Performance metrics and alerts
- **BUSINESS** - Business logic events
- **AUDIT** - Audit trail and compliance
- **HTTP** - HTTP request/response logs
- **ERROR** - Error events
- **DEBUG** - Debug information

## 🔧 Configuration Options

### Monitoring Configuration
```javascript
const monitoringOptions = {
  enableLogging: true,
  enablePerformanceMonitoring: true,
  enableMetrics: true,
  enableHealthChecks: true,
  enableSystemMetrics: true,
  logLevel: 'info',
};
```

### Alert Thresholds
```javascript
alertThresholds: {
  memoryUsage: 85,      // percentage
  cpuUsage: 80,         // percentage
  responseTime: 2000,   // ms
  errorRate: 5,         // percentage
  diskUsage: 90,        // percentage
}
```

## 📈 Business Metrics

Automatic business event tracking for:
- User registrations
- Job postings
- Job applications
- User logins
- API calls
- Match creations
- Profile updates

## 🔒 Security Features

- **Sensitive Data Sanitization**: Passwords, tokens, and secrets are automatically redacted
- **Security Event Detection**: Failed logins, unauthorized access attempts
- **Audit Trail**: Complete audit log for compliance
- **Correlation ID Tracking**: Full request tracing capability

## 🚨 Alert System

Configurable alerts for:
- High memory usage (>85%)
- High CPU usage (>80%)
- Slow responses (>2 seconds)
- High error rate (>5%)
- System health degradation

## 📝 Example Usage

### Manual Logging
```javascript
import { logger } from './src/utils/enhanced-logger.js';

// Basic logging
logger.info('User logged in', { userId: '123' }, correlationId);
logger.error('Database connection failed', { error: dbError }, correlationId);

// Business events
logger.business('job_application', {
  userId: '123',
  jobId: '456',
  timestamp: Date.now()
}, correlationId);

// Security events
logger.security('Failed login attempt', 'medium', {
  ip: req.ip,
  userAgent: req.get('user-agent')
}, correlationId);

// Performance metrics
logger.performance('API Response Time', {
  endpoint: '/api/jobs',
  responseTime: 150
}, correlationId);
```

### Service-Specific Loggers
```javascript
import { createLogger } from './src/utils/enhanced-logger.js';

const userServiceLogger = createLogger('UserService');
const jobServiceLogger = createLogger('JobService');
```

### Metrics Collection
```javascript
import { metricsService } from './src/services/metrics.js';

// Increment counters
metricsService.increment('user.registrations', 1, { plan: 'premium' });

// Record histograms
metricsService.histogram('api.response_time', responseTime, { endpoint: '/api/jobs' });

// Set gauges
metricsService.gauge('active.users', activeUserCount);
```

## 📚 Integration with Existing Code

### Middleware Integration
The monitoring system integrates automatically when you use the enhanced server. For manual integration:

```javascript
import { initializeMonitoring } from './src/config/monitoring.js';

const app = express();
const { monitoring, services, loggers } = await initializeMonitoring(app);
```

### Request Context Access
```javascript
app.use((req, res, next) => {
  // Correlation ID is automatically added
  console.log('Request ID:', req.correlationId);
  
  // Access monitoring services
  req.monitoring.logger.info('Processing request');
  
  next();
});
```

## 🔄 Migration from Existing Logging

If you have existing logging code, you can migrate gradually:

1. **Keep existing loggers** - The enhanced logger is compatible
2. **Add correlation IDs** - Pass `req.correlationId` as the third parameter
3. **Use categories** - Specify appropriate log categories
4. **Leverage business events** - Convert business logs to use `logger.business()`

## 🎯 Benefits

✅ **Complete Request Tracing** - Follow requests through your entire application
✅ **Performance Insights** - Identify bottlenecks and performance issues
✅ **Security Monitoring** - Detect and alert on security events
✅ **Business Intelligence** - Track business metrics and events
✅ **Operational Excellence** - Monitor system health and performance
✅ **Compliance Ready** - Comprehensive audit trails
✅ **Developer Friendly** - Rich debugging information and structured logs

## 🛠️ Troubleshooting

### Log File Permissions
Ensure the application has write permissions to the `logs/` directory:
```bash
mkdir -p logs
chmod 755 logs
```

### Memory Usage
If log files grow too large, adjust the retention settings in the logger configuration:
```javascript
maxFileSize: 10 * 1024 * 1024, // 10MB
maxFiles: 10, // Keep 10 files
```

### Performance Impact
The monitoring system is designed to be lightweight, but you can disable features if needed:
```javascript
const monitoringOptions = {
  enableSystemMetrics: false, // Disable if CPU usage is a concern
  enablePerformanceMonitoring: false, // Disable if not needed
};
```

## 📞 Support

This implementation provides comprehensive logging and monitoring for the AlignME platform. The system is production-ready and includes all the requested features:

1. ✅ Winston logger with different log levels and transport configurations
2. ✅ Request logging middleware with correlation IDs for tracing  
3. ✅ Application performance monitoring with metrics collection

All components are fully integrated and ready to use!
