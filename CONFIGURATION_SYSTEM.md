# 🚀 AlignME Centralized Configuration System

A comprehensive environment configuration management system with validation, environment-specific settings, and schema validation using Joi.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration Structure](#configuration-structure)
- [Environment Files](#environment-files)
- [Validation Schema](#validation-schema)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🌟 Overview

The AlignME centralized configuration system provides:

- **Centralized Management**: Single point of configuration for the entire application
- **Environment Validation**: Joi-based schema validation for all environment variables
- **Environment-Specific Settings**: Different configurations for development, staging, production, and test environments
- **Type Safety**: Automatic type conversion and validation
- **Startup Validation**: Configuration validation occurs at application startup
- **Helper Methods**: Convenient methods to access specific configuration sections

## ✨ Features

### ✅ Validation Features
- Required field validation based on environment
- Data type validation and conversion  
- Value range and format validation
- Custom validation rules per environment
- Detailed error messages with context

### 🌍 Environment Support
- **Development**: Debug logging, mock services, relaxed security
- **Staging**: Production-like with testing features enabled
- **Production**: Strict validation, enhanced security, minimal logging
- **Test**: Optimized for fast test execution

### 🔒 Security Features
- Minimum secret key lengths enforced in production
- Environment-specific security settings
- Sensitive data handling best practices
- CORS configuration validation

## 🔧 Installation

The configuration system is included in the AlignME project. Required dependencies:

```json
{
  "joi": "^17.x.x",
  "dotenv": "^16.x.x"
}
```

## 🚀 Quick Start

### 1. Basic Usage

```javascript
import environmentConfig from './config/environment.js';

// Initialize configuration (validates environment variables)
await environmentConfig.initialize();

// Get the validated configuration
const config = environmentConfig.getConfig();

// Use configuration values
console.log(`Server running on port: ${config.PORT}`);
console.log(`Environment: ${config.NODE_ENV}`);
```

### 2. Using Helper Methods

```javascript
// Check environment
if (environmentConfig.isProduction()) {
  console.log('Running in production mode');
}

// Get database configuration
const dbConfig = environmentConfig.getDatabaseConfig();
console.log(`Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

// Get upload configuration
const uploadConfig = environmentConfig.getUploadConfig();
console.log(`Max file size: ${uploadConfig.maxSizes.resume}MB`);
```

### 3. Using with Startup Class

```javascript
import AlignMEStartup from './src/startup.js';

const startup = new AlignMEStartup();
await startup.start();

// Server is now running with validated configuration
```

## 📁 Configuration Structure

```
config/
├── environment.js          # Main configuration service
├── index.js               # Configuration manager integration
├── app.js                 # Application-specific config
├── auth.js                # Authentication config
├── database.js            # Database config
└── email.js               # Email config

.env files:
├── .env                   # Base environment file
├── .env.development       # Development settings
├── .env.staging           # Staging settings
├── .env.production        # Production settings
└── .env.example           # Template file
```

## 🌍 Environment Files

### Development (.env.development)
```bash
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug
ENABLE_MOCK_DATA=true
BCRYPT_ROUNDS=10
RATE_LIMIT_MAX=1000
```

### Staging (.env.staging)  
```bash
NODE_ENV=staging
PORT=3000
LOG_LEVEL=info
ENABLE_MOCK_DATA=false
BCRYPT_ROUNDS=12
RATE_LIMIT_MAX=200
```

### Production (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=${PROD_DATABASE_URL}
JWT_SECRET=${PROD_JWT_SECRET}
SESSION_SECRET=${PROD_SESSION_SECRET}
LOG_LEVEL=warn
ENABLE_API_DOCS=false
RATE_LIMIT_MAX=100
```

## 🔍 Validation Schema

### Required Fields by Environment

| Field | Development | Staging | Production | Test |
|-------|------------|---------|------------|------|
| `DATABASE_URL` | Optional | Optional | **Required** | Optional |
| `JWT_SECRET` | Required (32+ chars) | Required (32+ chars) | **Required (64+ chars)** | Required |
| `SESSION_SECRET` | Required (32+ chars) | Required (32+ chars) | **Required (64+ chars)** | Required |
| `SMTP_HOST` | Optional | Optional | **Required** | Optional |

### Validation Rules

```javascript
// Port validation
PORT: Joi.number().port().default(3000)

// JWT Secret validation (stronger in production)
JWT_SECRET: Joi.string()
  .min(32)
  .when('NODE_ENV', {
    is: 'production',
    then: Joi.min(64).required(),
    otherwise: Joi.required()
  })

// Database URL validation (required in production)
DATABASE_URL: Joi.string()
  .uri({ scheme: ['postgresql', 'postgres'] })
  .when('NODE_ENV', {
    is: 'production', 
    then: Joi.required(),
    otherwise: Joi.optional()
  })
```

## 💡 Usage Examples

### Basic Configuration Access

```javascript
import environmentConfig from './config/environment.js';

// Initialize once at startup
await environmentConfig.initialize();

// Access configuration throughout your app
const config = environmentConfig.getConfig();

// Server setup
const app = express();
app.set('port', config.PORT);

// Database connection
const sequelize = new Sequelize(config.DATABASE_URL || {
  host: config.DB_HOST,
  port: config.DB_PORT,
  database: config.DB_NAME,
  username: config.DB_USER,
  password: config.DB_PASSWORD
});
```

### Environment-Specific Logic

```javascript
// Conditional features based on environment
if (environmentConfig.isDevelopment()) {
  app.use(morgan('dev'));
  app.use('/dev-tools', devToolsRouter);
}

if (environmentConfig.isProduction()) {
  app.use(compression());
  app.use(helmet({ hsts: true }));
}

// Feature flags
if (config.ENABLE_API_DOCS) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
```

### Configuration Helpers

```javascript
// Database configuration
const dbConfig = environmentConfig.getDatabaseConfig();
const sequelize = new Sequelize(dbConfig.url || dbConfig);

// Redis configuration  
const redisConfig = environmentConfig.getRedisConfig();
const redis = new Redis(redisConfig.url || redisConfig);

// JWT configuration
const jwtConfig = environmentConfig.getJWTConfig();
const token = jwt.sign(payload, jwtConfig.secret, { 
  expiresIn: jwtConfig.expiresIn 
});

// Upload configuration
const uploadConfig = environmentConfig.getUploadConfig();
const upload = multer({
  dest: uploadConfig.directory,
  limits: {
    fileSize: uploadConfig.maxSizes.resume * 1024 * 1024
  }
});
```

## 📚 API Reference

### EnvironmentConfig Class

#### Methods

##### `initialize(env?: string): Promise<Object>`
Loads and validates environment configuration.

```javascript
const config = await environmentConfig.initialize('production');
```

##### `getConfig(): Object`
Returns the validated configuration object.

##### `get(key: string): any`
Get a specific configuration value.

```javascript
const port = environmentConfig.get('PORT');
```

##### Environment Checks
- `isProduction(): boolean`
- `isDevelopment(): boolean` 
- `isStaging(): boolean`
- `isTest(): boolean`

##### Helper Methods
- `getDatabaseConfig(): Object` - Database connection settings
- `getRedisConfig(): Object` - Redis connection settings
- `getJWTConfig(): Object` - JWT configuration
- `getUploadConfig(): Object` - File upload settings

### Configuration Health Check

Access configuration status via HTTP endpoint:

```bash
GET /health/config
```

Response:
```json
{
  "status": "healthy",
  "environment": "development",
  "timestamp": "2025-08-07T12:00:00.000Z",
  "configuration": {
    "database": {
      "host": "localhost",
      "port": 5432,
      "name": "alignme_dev",
      "poolMax": 10
    },
    "server": {
      "port": 3001,
      "logLevel": "debug"
    },
    "features": {
      "apiDocs": true,
      "mockData": true,
      "mockEmail": true
    }
  }
}
```

## 🧪 Testing

### Running Configuration Tests

```bash
# Run configuration validation tests
node tests/config-validation.test.js

# Or with npm script
npm run test:config
```

### Test Coverage

The test suite covers:
- ✅ Valid configuration validation
- ✅ Missing required fields detection
- ✅ Invalid value validation
- ✅ Environment-specific defaults
- ✅ Helper method functionality
- ✅ Type conversion validation

### Example Test Output

```
🧪 Running Configuration Validation Tests...
✅ Valid Development Configuration: PASS
✅ Missing Required Fields in Production: PASS
✅ Invalid JWT Secret Length: PASS
✅ Environment-Specific Defaults: PASS

📊 Test Results Summary:
✅ Passed: 7
❌ Failed: 0
📈 Total: 7
```

## 🏆 Best Practices

### 1. Environment Variables

```bash
# ✅ Good: Descriptive names
DATABASE_URL=postgresql://user:pass@localhost:5432/alignme
JWT_SECRET=your-super-secure-jwt-secret-64-chars-minimum-for-production

# ❌ Bad: Vague names  
DB=postgresql://user:pass@localhost:5432/alignme
SECRET=short
```

### 2. Production Secrets

```bash
# ✅ Good: Use environment variable references
JWT_SECRET=${PROD_JWT_SECRET}
DATABASE_URL=${PROD_DATABASE_URL}

# ❌ Bad: Hardcode in files
JWT_SECRET=actual-secret-in-file
```

### 3. Validation Errors

```javascript
// ✅ Good: Handle configuration errors gracefully
try {
  await environmentConfig.initialize();
} catch (error) {
  logger.error('Configuration validation failed:', error.message);
  process.exit(1);
}

// ❌ Bad: Let errors crash the application
await environmentConfig.initialize(); // May throw unhandled error
```

### 4. Configuration Access

```javascript
// ✅ Good: Use helper methods
const dbConfig = environmentConfig.getDatabaseConfig();

// ❌ Bad: Access raw config repeatedly  
const config = environmentConfig.getConfig();
const host = config.DB_HOST;
const port = config.DB_PORT;
```

## 🔧 Troubleshooting

### Common Issues

#### 1. **Configuration Validation Failed**
```
❌ Environment validation failed:
  • JWT_SECRET: "JWT_SECRET" length must be at least 32 characters long
  • DATABASE_URL: "DATABASE_URL" is required
```

**Solution**: Check your environment file and ensure all required fields are present with valid values.

#### 2. **Environment File Not Found**
```
❌ Failed to load environment configuration: ENOENT: no such file or directory
```

**Solution**: Ensure the appropriate `.env.{environment}` file exists and is readable.

#### 3. **Invalid Port Number**
```
❌ Environment validation failed:
  • PORT: "PORT" must be a valid port
```

**Solution**: Ensure PORT is a number between 1 and 65535.

#### 4. **Production Secrets Missing**
```
❌ Environment validation failed:
  • JWT_SECRET: "JWT_SECRET" length must be at least 64 characters long
```

**Solution**: In production, secrets must meet higher security requirements.

### Debug Mode

Enable debug logging to see detailed configuration information:

```bash
LOG_LEVEL=debug npm start
```

### Validation Details

The system provides detailed validation errors:

```javascript
try {
  await environmentConfig.initialize();
} catch (error) {
  console.log('Validation errors:', error.message);
  // Shows exactly which fields failed validation
}
```

## 📖 Additional Resources

- [Joi Validation Documentation](https://joi.dev/api/)
- [Node.js Environment Variables](https://nodejs.org/api/process.html#process_process_env)
- [12-Factor App Configuration](https://12factor.net/config)
- [AlignME Project Documentation](./README.md)

## 🤝 Contributing

When adding new configuration options:

1. Add validation to the schema in `config/environment.js`
2. Update environment-specific defaults if needed
3. Add tests to `tests/config-validation.test.js`
4. Update this documentation
5. Update `.env.example` with the new option

## 📄 License

© 2025 AlignME. All rights reserved.
