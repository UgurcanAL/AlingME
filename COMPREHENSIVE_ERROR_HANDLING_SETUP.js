/**
 * AlignME Error Handling and Validation Setup Guide
 * Complete integration example for the AlingME project
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { setupErrorHandlers, asyncHandler } from './src/middleware/errorHandler.js';
import { 
  AlignMEError, 
  AlignMEValidationError, 
  AlignMEAuthenticationError,
  AlignMEErrorCodes 
} from './src/utils/errors.js';
import { createAlignMELogger } from './src/utils/logger.js';

// Import route modules
import profileEnhancementRoutes from './src/routes/profileEnhancement.js';
import usersRoutes from './routes/users.js';
import apiRoutes from './routes/api.js';

const app = express();
const logger = createAlignMELogger('Server');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new AlignMEValidationError('Invalid JSON format', [], AlignMEErrorCodes.INVALID_INPUT_FORMAT);
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Request ID middleware
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      requestId: req.id
    });
  });
  
  next();
});

// API Routes with comprehensive error handling
app.use('/api/profile-enhancement', profileEnhancementRoutes);
app.use('/api/users', usersRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
}));

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    message: 'AlignME API Documentation',
    version: '2.0.0',
    endpoints: {
      profileEnhancement: {
        'POST /api/profile-enhancement/skills': 'Add or update skills',
        'POST /api/profile-enhancement/experience': 'Add work experience',
        'POST /api/profile-enhancement/portfolio/projects': 'Add portfolio project',
        'GET /api/profile-enhancement/portfolio/analysis': 'Analyze portfolio strength',
        'POST /api/profile-enhancement/portfolio/github-sync': 'Sync GitHub portfolio'
      },
      health: {
        'GET /health': 'Server health check',
        'GET /api/health/errors': 'Error statistics'
      }
    },
    errorHandling: {
      standardFormat: {
        success: false,
        error: {
          code: 'ERROR_CODE',
          message: 'Error message',
          timestamp: 'ISO timestamp',
          requestId: 'Unique request ID'
        }
      },
      validationErrors: {
        details: 'Array of validation error details'
      }
    },
    validation: {
      inputSanitization: 'All inputs are sanitized and validated',
      securityChecks: 'XSS, SQL injection, and other security checks applied',
      rateLimit: '100 requests per 15 minutes per IP'
    }
  });
});

// Setup comprehensive error handling (must be after all routes)
setupErrorHandlers(app);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  app.close(() => {
    logger.info('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 AlignME server running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

export default app;

/**
 * USAGE EXAMPLES:
 * 
 * 1. Portfolio Project Creation with Validation:
 * 
 * POST /api/profile-enhancement/portfolio/projects
 * Content-Type: application/json
 * Authorization: Bearer <token>
 * 
 * {
 *   "title": "E-commerce Platform",
 *   "description": "Full-stack e-commerce application built with React and Node.js",
 *   "technologies": ["React", "Node.js", "MongoDB", "Express", "Stripe"],
 *   "metadata": {
 *     "technicalComplexity": "high",
 *     "projectScale": "team",
 *     "industryRelevance": ["Technology", "E-commerce"],
 *     "skillsDemo": ["Frontend Development", "Backend Development", "Payment Integration"],
 *     "innovationLevel": "innovative"
 *   },
 *   "verification": {
 *     "codeRepoUrl": "https://github.com/user/ecommerce-platform",
 *     "liveDemoUrl": "https://my-ecommerce.herokuapp.com"
 *   }
 * }
 * 
 * 2. GitHub Portfolio Sync:
 * 
 * POST /api/profile-enhancement/portfolio/github-sync
 * Content-Type: application/json
 * Authorization: Bearer <token>
 * 
 * {
 *   "githubUsername": "johndoe",
 *   "selectedRepos": ["repo1", "repo2", "repo3"],
 *   "includePrivate": false
 * }
 * 
 * 3. Skills Addition:
 * 
 * POST /api/profile-enhancement/skills
 * Content-Type: application/json
 * Authorization: Bearer <token>
 * 
 * {
 *   "skills": [
 *     {
 *       "name": "React",
 *       "level": "advanced",
 *       "category": "frontend",
 *       "yearsOfExperience": 3
 *     },
 *     {
 *       "name": "Node.js",
 *       "level": "intermediate",
 *       "category": "backend",
 *       "yearsOfExperience": 2
 *     }
 *   ],
 *   "source": "manual",
 *   "verified": false
 * }
 * 
 * ERROR RESPONSES:
 * 
 * Validation Error (400):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Input validation failed",
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_12345",
 *     "details": [
 *       {
 *         "field": "title",
 *         "message": "Project title is required",
 *         "value": ""
 *       }
 *     ]
 *   }
 * }
 * 
 * Authentication Error (401):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "AUTHENTICATION_ERROR",
 *     "message": "User authentication required",
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_12345"
 *   }
 * }
 * 
 * Internal Server Error (500):
 * {
 *   "success": false,
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "message": "An unexpected error occurred",
 *     "timestamp": "2024-01-01T00:00:00.000Z",
 *     "requestId": "req_12345"
 *   }
 * }
 */
