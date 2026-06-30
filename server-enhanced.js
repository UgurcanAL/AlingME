/**
 * AlignME Server with Enhanced Logging and Performance Monitoring
 * Comprehensive Winston logger implementation with correlation IDs and metrics collection
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import helmet from 'helmet';
import environmentConfig from './config/environment.js';
import { swaggerSpec, swaggerUiOptions } from './src/config/swagger.js';

// Import monitoring system
import { initializeMonitoring } from './src/config/monitoring.js';
import { logger } from './src/utils/enhanced-logger.js';
import monitoringRoutes from './src/routes/monitoring.js';

// Import existing routes
import apiRoutes from './routes/api.js';
import userRoutes from './routes/users.js';
import aiMatchingRoutes from './src/routes/aiMatching.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * AlignME Application Server
 */
class AlignMEServer {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the AlignME server with comprehensive monitoring
   */
  async initialize() {
    try {
      // Initialize environment configuration
      logger.info('🚀 Initializing AlignME Environment Configuration...');
      await environmentConfig.initialize();
      const config = environmentConfig.getConfig();
      this.port = config.PORT || 3000;

      // Initialize monitoring system first
      logger.info('📊 Initializing comprehensive monitoring system...');
      const monitoringOptions = {
        enableLogging: true,
        enablePerformanceMonitoring: true,
        enableMetrics: true,
        enableHealthChecks: true,
        enableSystemMetrics: true,
        logLevel: process.env.LOG_LEVEL || 'info',
      };

      const { monitoring, services, loggers } = await initializeMonitoring(this.app, monitoringOptions);
      
      // Store monitoring services for later use
      this.monitoring = monitoring;
      this.services = services;
      this.loggers = loggers;

      logger.info('✅ Monitoring system initialized successfully');

      // Configure Express app
      await this.configureApp();

      // Setup routes
      this.setupRoutes();

      // Setup error handling
      this.setupErrorHandling();

      logger.info('🎯 AlignME server initialization complete');

    } catch (error) {
      logger.error('Failed to initialize AlignME server', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Configure Express application
   */
  async configureApp() {
    logger.info('⚙️ Configuring Express application...');

    // Security headers
    this.app.use(helmet());

    // Parse JSON bodies
    this.app.use(express.json());

    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));

    // Set EJS as the templating engine
    this.app.set('view engine', 'ejs');
    this.app.set('views', path.join(__dirname, 'views'));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Trust proxy for accurate IP addresses
    this.app.set('trust proxy', true);

    logger.info('✅ Express application configured');
  }

  /**
   * Setup application routes
   */
  setupRoutes() {
    logger.info('🛤️ Setting up routes...');

    // Health check endpoint (before other middlewares)
    this.app.get('/health', (req, res) => {
      const healthStatus = this.services.performanceMonitor.getHealthStatus();
      res.status(healthStatus.status === 'healthy' ? 200 : 503).json({
        status: healthStatus.status,
        timestamp: Date.now(),
        uptime: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
      });
    });

    // Monitoring routes
    this.app.use('/api/monitoring', monitoringRoutes);

    // Existing API routes
    this.app.use('/api', apiRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/ai-matching', aiMatchingRoutes);

    // API Documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

    // Root route
    this.app.get('/', (req, res) => {
      res.json({
        message: '🎯 Welcome to AlignME - Connecting Talent with Opportunities',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        monitoring: this.monitoring.getStatus(),
        endpoints: {
          health: '/health',
          apiDocs: '/api-docs',
          monitoring: '/api/monitoring',
          api: '/api',
        },
        timestamp: new Date().toISOString(),
      });

      // Log API access
      logger.business('root_access', {
        userAgent: req.get('user-agent'),
        ip: req.ip,
      }, req.correlationId);
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      logger.warn('Route not found', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        correlationId: req.correlationId,
      });

      res.status(404).json({
        success: false,
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        timestamp: new Date().toISOString(),
      });
    });

    logger.info('✅ Routes configured');
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    logger.info('🛡️ Setting up error handling...');

    // Global error handler
    this.app.use((error, req, res, next) => {
      const statusCode = error.statusCode || error.status || 500;
      const correlationId = req.correlationId;

      // Log the error
      logger.error('Application Error', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          statusCode,
        },
        request: {
          method: req.method,
          url: req.originalUrl,
          ip: req.ip,
          userAgent: req.get('user-agent'),
          correlationId,
        },
      }, correlationId);

      // Record error metrics
      this.services.metricsService.increment('app.errors.total', 1, {
        statusCode: statusCode.toString(),
        errorType: error.name,
      });

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(statusCode).json({
        success: false,
        error: isDevelopment ? error.message : 'Internal Server Error',
        correlationId,
        timestamp: new Date().toISOString(),
        ...(isDevelopment && { stack: error.stack }),
      });
    });

    logger.info('✅ Error handling configured');
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();

      const server = this.app.listen(this.port, () => {
        logger.info(`🚀 AlignME server started successfully`, {
          category: 'SYSTEM',
          port: this.port,
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid,
          nodeVersion: process.version,
          monitoring: this.monitoring.getStatus(),
        });

        // Log system startup metrics
        logger.performance('Server Startup', {
          port: this.port,
          startupTime: Date.now(),
          memoryUsage: process.memoryUsage(),
        });

        // Record startup business event
        logger.business('server_startup', {
          port: this.port,
          environment: process.env.NODE_ENV,
          version: process.env.npm_package_version,
        });

        console.log(`
🎯 AlignME Server Running Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Server URL: http://localhost:${this.port}
📚 API Docs: http://localhost:${this.port}/api-docs
🏥 Health Check: http://localhost:${this.port}/health
📊 Monitoring: http://localhost:${this.port}/api/monitoring/health

🔍 Monitoring Features:
  ✅ Winston Logger with multiple transports
  ✅ Request logging with correlation IDs
  ✅ Performance monitoring and metrics
  ✅ System health checks
  ✅ Comprehensive error tracking
  ✅ Business event logging

🌍 Environment: ${process.env.NODE_ENV || 'development'}
📦 Version: ${process.env.npm_package_version || '1.0.0'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);
      });

      // Store server instance for graceful shutdown
      this.server = server;

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start system health reporting
      this.startHealthReporting();

    } catch (error) {
      logger.error('Failed to start AlignME server', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown
   */
  setupGracefulShutdown() {
    const gracefulShutdown = (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`Received ${signal}, performing graceful shutdown`, {
        category: 'SYSTEM',
        signal,
      });

      // Close server
      this.server.close(() => {
        logger.info('HTTP server closed');

        // Log shutdown business event
        logger.business('server_shutdown', {
          signal,
          uptime: Math.round(process.uptime()),
        });

        // Final system metrics
        logger.logSystemHealth();

        // Allow time for final logs to be written
        setTimeout(() => {
          logger.info('AlignME server shutdown complete');
          process.exit(0);
        }, 2000);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  }

  /**
   * Start periodic health reporting
   */
  startHealthReporting() {
    // Report system health every 5 minutes
    setInterval(() => {
      const health = this.services.performanceMonitor.getHealthStatus();
      const metrics = this.services.performanceMonitor.getSystemMetrics();

      logger.performance('Periodic Health Report', {
        health: health.status,
        uptime: Math.round(process.uptime()),
        requests: metrics.application.totalRequests,
        errors: metrics.application.totalErrors,
        memory: metrics.memory.percentUsed,
      });

      // Record business metrics
      this.services.metricsService.recordBusinessMetric('health_report', {
        status: health.status,
        uptime: metrics.process.uptime,
        memoryUsage: metrics.memory.percentUsed,
      });

    }, 5 * 60 * 1000); // Every 5 minutes

    logger.info('Periodic health reporting started');
  }
}

// Create and start server
const alignmeServer = new AlignMEServer();

// Handle startup
alignmeServer.start().catch((error) => {
  console.error('Failed to start AlignME server:', error);
  process.exit(1);
});

export default alignmeServer;
