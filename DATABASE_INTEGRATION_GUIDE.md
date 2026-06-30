# AlignME Database Integration Guide

Following TARDIS blue theme principles (#003B6F) - Comprehensive database integration for production-ready AlignME platform.

## 🔷 Overview

This document guides you through the complete database integration process for AlignME, replacing mock data services with real PostgreSQL database implementation.

## 📋 Prerequisites

### Required Software

- **PostgreSQL 12+** (Database server)
- **Node.js 16+** (Runtime environment)
- **npm/yarn** (Package manager)

### Environment Setup

Create a `.env` file in the project root:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=alignme_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Application Configuration
NODE_ENV=development
PORT=3000
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install pg sequelize bcryptjs jsonwebtoken
npm install --save-dev @types/pg @types/bcryptjs @types/jsonwebtoken
```

### 2. Setup Database

```bash
# Create PostgreSQL database
createdb alignme_db

# Run setup script
node scripts/setup-database.js --create-schema --migrate-mock-data
```

### 3. Update Your Application

```javascript
// Replace mock imports with database services
import { databaseService } from './src/services/database/index.js';

// Example: Get all users
const users = await databaseService.users.getAllUsers();

// Example: Create a job
const job = await databaseService.jobs.createJob(jobData);
```

## 🏗️ Database Architecture

### Core Models

- **Users** - Authentication, profiles, roles (seeker/employer/admin)
- **Jobs** - Job postings with comprehensive details
- **Applications** - Job applications with status tracking
- **SeekerProfiles** - Extended profiles for job seekers
- **Skills** - Skills taxonomy and user skills
- **Messages** - Internal messaging system
- **Notifications** - Real-time notifications

### Key Features

- **PostgreSQL** with Sequelize ORM
- **JWT Authentication** with bcrypt password hashing
- **Soft Deletes** for data safety (paranoid mode)
- **Comprehensive Indexing** for performance
- **JSONB Fields** for flexible data storage
- **Foreign Key Constraints** for data integrity

## 📊 Database Services

### User Service

```javascript
// Authentication
const { user, token } = await databaseService.users.register(userData);
const { user, token } = await databaseService.users.login(email, password);
const user = await databaseService.users.verifyToken(token);

// Profile Management
const user = await databaseService.users.getUserById(id);
const updatedUser = await databaseService.users.updateProfile(id, updates);
const users = await databaseService.users.searchUsers(query, filters);
```

### Job Service

```javascript
// Job Management
const job = await databaseService.jobs.createJob(jobData);
const job = await databaseService.jobs.getJobById(id);
const jobs = await databaseService.jobs.getAllJobs(page, limit, filters);
const jobs = await databaseService.jobs.searchJobs(query, filters);

// Job Matching
const recommendedJobs = await databaseService.jobs.getRecommendedJobs(userId);
const jobsBySkills = await databaseService.jobs.getJobsBySkills(skills);
```

### Application Service

```javascript
// Application Management
const application =
  await databaseService.applications.createApplication(appData);
const applications =
  await databaseService.applications.getApplicationsByUser(userId);
const applications =
  await databaseService.applications.getApplicationsByJob(jobId);

// Status Management
const updated = await databaseService.applications.updateApplicationStatus(
  id,
  status
);
const stats = await databaseService.applications.getApplicationStats(userId);
```

## 🔄 Migration from Mock Data

### Automatic Migration

The setup script can automatically migrate existing mock data:

```bash
node scripts/setup-database.js --migrate-mock-data
```

### Manual Migration

```javascript
import { migrationUtility } from './src/services/database/migrationUtility.js';

// Run complete migration
await migrationUtility.migrateFromMockData();

// Check migration health
const isHealthy = await migrationUtility.healthCheck();
```

## 🛠️ Integration Steps

### Step 1: Replace Route Handlers

**Before (Mock Data):**

```javascript
// routes/auth.js
app.post('/api/auth/register', async (req, res) => {
  const users = JSON.parse(fs.readFileSync('./src/data/users.json'));
  // ... mock data handling
});
```

**After (Database):**

```javascript
// routes/auth.js
import { databaseService } from '../services/database/index.js';

app.post('/api/auth/register', async (req, res) => {
  try {
    const { user, token } = await databaseService.users.register(req.body);
    res.json({ success: true, user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Step 2: Update Job Routes

**Before:**

```javascript
app.get('/api/jobs', (req, res) => {
  const jobs = JSON.parse(fs.readFileSync('./src/data/jobs.json'));
  res.json(jobs);
});
```

**After:**

```javascript
app.get('/api/jobs', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await databaseService.jobs.getAllJobs(
      page,
      limit,
      req.query
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Step 3: Update Application Routes

**Before:**

```javascript
app.post('/api/applications', (req, res) => {
  const applications = JSON.parse(
    fs.readFileSync('./src/data/applications.json')
  );
  // ... mock data handling
});
```

**After:**

```javascript
app.post('/api/applications', async (req, res) => {
  try {
    const application = await databaseService.applications.createApplication(
      req.body
    );
    res.json({ success: true, application });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 🔧 Configuration Options

### Database Configuration

```javascript
// src/config/database.ts
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'alignme_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development',
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
```

### Service Initialization

```javascript
// src/server.js
import { databaseService } from './services/database/index.js';

// Initialize database services on startup
await databaseService.initialize();

// Health check endpoint
app.get('/api/health/database', async (req, res) => {
  const health = await databaseService.healthCheck();
  res.json(health);
});
```

## 🚨 Error Handling

### Common Patterns

```javascript
// Validation errors
try {
  const user = await databaseService.users.register(userData);
} catch (error) {
  if (error.message === 'User with this email already exists') {
    return res.status(409).json({ error: 'Email already registered' });
  }
  return res.status(400).json({ error: error.message });
}

// Database connection errors
try {
  await databaseService.users.getAllUsers();
} catch (error) {
  console.error('Database error:', error);
  return res.status(500).json({ error: 'Database temporarily unavailable' });
}
```

## 📈 Performance Optimization

### Indexing Strategy

```sql
-- Automatically created by models
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_jobs_employer_id ON jobs(employer_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_seeker_id ON applications(seeker_id);
```

### Query Optimization

```javascript
// Use pagination for large datasets
const { jobs, total } = await databaseService.jobs.getAllJobs(page, limit);

// Use specific field selection
const users = await User.findAll({
  attributes: ['id', 'name', 'email'], // Only select needed fields
  limit: 50,
});

// Use includes for related data
const job = await Job.findByPk(id, {
  include: [
    {
      model: User,
      as: 'employer',
      attributes: ['id', 'name', 'companyName'],
    },
  ],
});
```

## 🔐 Security Considerations

### Password Security

- **bcrypt** with 12 salt rounds
- **JWT tokens** with expiration
- **Environment variables** for secrets

### Database Security

- **Parameterized queries** (Sequelize ORM)
- **Input validation** on all endpoints
- **Foreign key constraints** for data integrity
- **Soft deletes** to prevent data loss

## 🧪 Testing Database Integration

### Unit Tests

```javascript
// test/database/userService.test.js
import { databaseService } from '../../src/services/database/index.js';

describe('User Service', () => {
  beforeEach(async () => {
    await databaseService.initialize();
  });

  test('should create user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'seeker',
    };

    const { user, token } = await databaseService.users.register(userData);
    expect(user.email).toBe(userData.email);
    expect(token).toBeDefined();
  });
});
```

### Integration Tests

```javascript
// test/integration/api.test.js
import request from 'supertest';
import app from '../../src/server.js';

describe('API Integration', () => {
  test('POST /api/auth/register', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      role: 'seeker',
    });

    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.token).toBeDefined();
  });
});
```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification
- `POST /api/auth/logout` - User logout

### Job Endpoints

- `GET /api/jobs` - List jobs with pagination and filters
- `POST /api/jobs` - Create new job (employers only)
- `GET /api/jobs/:id` - Get job details
- `PUT /api/jobs/:id` - Update job (employer only)
- `DELETE /api/jobs/:id` - Delete job (employer only)

### Application Endpoints

- `POST /api/applications` - Apply for job
- `GET /api/applications/user/:userId` - Get user applications
- `GET /api/applications/job/:jobId` - Get job applications
- `PUT /api/applications/:id/status` - Update application status

## 🚀 Production Deployment

### Environment Variables

```env
# Production settings
NODE_ENV=production
DB_HOST=your-production-db-host
DB_NAME=alignme_production
JWT_SECRET=your-super-secure-production-jwt-secret

# Connection pooling
DB_POOL_MAX=20
DB_POOL_MIN=5
```

### Database Migrations

```bash
# Run migrations in production
NODE_ENV=production node scripts/setup-database.js

# Backup before migration
pg_dump alignme_production > backup.sql
```

## 🔍 Monitoring and Logging

### Health Checks

```javascript
// Monitor database health
app.get('/health', async (req, res) => {
  const health = await databaseService.healthCheck();
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

### Performance Monitoring

```javascript
// Log slow queries
const sequelize = new Sequelize(config, {
  logging: (sql, timing) => {
    if (timing > 1000) {
      // Log queries > 1 second
      console.warn(`Slow query (${timing}ms):`, sql);
    }
  },
  benchmark: true,
});
```

## 🆘 Troubleshooting

### Common Issues

**Connection Failed**

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify connection
psql -h localhost -U postgres -d alignme_db
```

**Migration Errors**

```bash
# Force sync in development
node scripts/setup-database.js --force-sync

# Check table structure
\d users
```

**Performance Issues**

```bash
# Check query performance
EXPLAIN ANALYZE SELECT * FROM jobs WHERE skills @> '["JavaScript"]';

# Monitor active connections
SELECT * FROM pg_stat_activity;
```

## 📞 Support

For additional support with database integration:

1. **Check Logs** - Review application and database logs
2. **Health Check** - Use `/api/health/database` endpoint
3. **Documentation** - Refer to Sequelize documentation
4. **Community** - PostgreSQL and Node.js communities

---

_This guide follows AlignME's TARDIS blue theme principles (#003B6F) - providing structured, comprehensive, and production-ready database integration._
