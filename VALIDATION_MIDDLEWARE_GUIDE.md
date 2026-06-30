# AlignME Validation Middleware Integration Guide

This guide provides comprehensive instructions for implementing the AlignME validation middleware system that includes input sanitization, DTO validation, and business rules validation.

## 🚀 Quick Start

### Basic Implementation

```javascript
import express from 'express';
import { validationPipelines } from './src/middleware/validation-index.js';

const app = express();

// Apply validation pipeline to user registration endpoint
app.post('/api/users/register', 
  ...validationPipelines.userRegistration,
  (req, res) => {
    // req.validatedData contains sanitized and validated data
    // req.businessRuleValidation contains business rule validation results
    console.log('Validated user data:', req.validatedData);
    res.json({ success: true, data: req.validatedData });
  }
);

// Apply validation pipeline to job posting endpoint
app.post('/api/jobs', 
  ...validationPipelines.jobPosting,
  (req, res) => {
    console.log('Validated job data:', req.validatedData);
    res.json({ success: true, data: req.validatedData });
  }
);
```

### Custom Pipeline Implementation

```javascript
import { AlignMEValidationPipeline } from './src/middleware/validation-index.js';

const customValidation = new AlignMEValidationPipeline({
  enableInputSanitization: true,
  enableDTOValidation: true,
  enableBusinessRules: false, // Disable for this endpoint
  logValidationSteps: true,
});

app.post('/api/custom', 
  ...customValidation.customPipeline(['userProfileUpdate', 'contentTypeJSON']),
  (req, res) => {
    res.json({ success: true, data: req.validatedData });
  }
);
```

## 🛡️ Input Sanitization Features

### XSS Protection
- Automatically removes dangerous HTML tags and JavaScript
- Sanitizes all string inputs recursively
- Logs security events with correlation IDs

### SQL Injection Prevention
- Detects and removes SQL injection patterns
- Validates query parameters and request bodies
- Maintains detailed attack attempt logs

### HTTP Parameter Pollution Protection
- Prevents duplicate parameter attacks
- Validates Content-Type headers
- Enforces request size limits

### Example Usage

```javascript
import { sanitizeInput, preventHPP, validateContentType } from './src/middleware/validation-index.js';

// Apply individual sanitization middleware
app.use('/api/secure', sanitizeInput);
app.use('/api/secure', preventHPP);
app.post('/api/secure/data', validateContentType(['application/json']), handler);

// Custom sanitization configuration
import { createInputSanitizer } from './src/middleware/validation-index.js';

const strictSanitizer = createInputSanitizer({
  enableXSSProtection: true,
  enableSQLInjectionPrevention: true,
  maxFieldSize: 5000,
  maxFieldCount: 50,
  blacklistedPatterns: [
    /javascript:/gi,
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  ],
});

app.use('/api/strict', strictSanitizer.sanitizeInput);
```

## 📝 DTO Validation Features

### Schema-Based Validation
- Uses Zod for type-safe validation
- Pre-built schemas for common AlignME data types
- Automatic data transformation and sanitization

### Built-in Schemas

```javascript
import { 
  validateUserRegistration,
  validateJobPosting,
  validateJobApplication,
  validateSearchQuery,
  validateTeamCreation 
} from './src/middleware/validation-index.js';

// User registration with built-in validation
app.post('/api/users/register', validateUserRegistration, (req, res) => {
  // req.validatedData is guaranteed to match userRegistrationDTO schema
  const { name, email, password, role, company, agreeToTerms } = req.validatedData;
  // Process validated data...
});

// Job posting with comprehensive validation
app.post('/api/jobs', validateJobPosting, (req, res) => {
  const { title, description, requirements, skills, salaryRange } = req.validatedData;
  // All fields are validated and sanitized
});
```

### Custom DTO Schemas

```javascript
import { z } from 'zod';
import { createDTOValidator } from './src/middleware/validation-index.js';

// Define custom DTO schema
const customUserSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
  tags: z.array(z.string().max(50)).max(10),
});

// Create validator middleware
const validateCustomUser = createDTOValidator(customUserSchema, {
  enableSanitization: true,
  logValidationErrors: true,
});

app.post('/api/users/preferences', validateCustomUser, (req, res) => {
  // req.validatedData matches customUserSchema exactly
});
```

## 🎯 Business Rules Validation

### AlignME-Specific Rules
- Job posting skill-experience alignment
- Salary range market validation
- Team formation skill coverage
- Profile consistency checks

### Usage Examples

```javascript
import { 
  validateJobPostingBusinessRules,
  validateUserProfileBusinessRules,
  validateTeamFormationBusinessRules 
} from './src/middleware/validation-index.js';

// Job posting with business rule validation
app.post('/api/jobs', 
  validateJobPosting,                    // DTO validation first
  validateJobPostingBusinessRules,       // Then business rules
  async (req, res) => {
    const jobData = req.validatedData;
    
    // Business rules have been validated:
    // - Skill-experience level alignment
    // - Salary range reasonableness
    // - Title-description consistency
    // - Requirements feasibility
    
    const job = await createJob(jobData);
    res.json({ success: true, job });
  }
);

// Profile update with business validation
app.put('/api/users/:id/profile',
  validateUserProfileUpdate,
  validateUserProfileBusinessRules,
  async (req, res) => {
    const profileData = req.validatedData;
    
    // Business rules validated:
    // - Experience timeline consistency
    // - Skills-experience alignment
    // - Education progression validation
    // - Professional headline consistency
    
    const updatedProfile = await updateUserProfile(req.params.id, profileData);
    res.json({ success: true, profile: updatedProfile });
  }
);
```

### Custom Business Rules

```javascript
import { createBusinessRuleValidator } from './src/middleware/validation-index.js';

// Create custom business rule validator
const validateCustomRules = createBusinessRuleValidator('custom', {
  strictMode: true,
  enableAsyncValidation: true,
  logViolations: true,
});

// Implement custom validation logic by extending the validator
import { AlignMEBusinessRulesValidator } from './src/middleware/validation-index.js';

class CustomBusinessValidator extends AlignMEBusinessRulesValidator {
  async validateCustomLogic(data, context) {
    const violations = [];
    
    // Implement your custom business rules
    if (data.customField && !this.validateCustomField(data.customField)) {
      violations.push({
        rule: 'custom_field_validation',
        message: 'Custom field does not meet business requirements',
        context: { value: data.customField }
      });
    }
    
    return { valid: violations.length === 0, violations };
  }
}
```

## 📊 Monitoring and Statistics

### Real-time Statistics

```javascript
import { validationStatsCollector } from './src/middleware/validation-index.js';

// Get comprehensive validation statistics
app.get('/api/admin/validation-stats', (req, res) => {
  const stats = validationStatsCollector.getComprehensiveStats();
  res.json(stats);
});

// Reset statistics
app.post('/api/admin/validation-stats/reset', (req, res) => {
  validationStatsCollector.resetAllStats();
  res.json({ message: 'Statistics reset successfully' });
});

// Export for monitoring systems
app.get('/metrics/validation', (req, res) => {
  const metrics = validationStatsCollector.exportStatsForMonitoring();
  res.json(metrics);
});
```

### Example Statistics Output

```json
{
  "sanitization": {
    "totalRequests": 15642,
    "sanitizedRequests": 3421,
    "blockedRequests": 127,
    "xssAttempts": 45,
    "sqlInjectionAttempts": 23,
    "sanitizationRate": "21.87%",
    "blockRate": "0.81%",
    "uptime": 86400
  },
  "dtoValidation": {
    "totalValidations": 12456,
    "successfulValidations": 11892,
    "failedValidations": 564,
    "successRate": "95.47%",
    "uptime": 86400
  },
  "businessRules": {
    "rulesEvaluated": 8934,
    "violationsDetected": 234,
    "asyncValidations": 1247,
    "violationRate": "2.62%",
    "uptime": 86400
  }
}
```

## 🔧 Configuration Options

### Global Configuration

```javascript
import { AlignMEValidationPipeline } from './src/middleware/validation-index.js';

const validationPipeline = new AlignMEValidationPipeline({
  enableInputSanitization: true,     // Enable XSS and SQL injection protection
  enableDTOValidation: true,         // Enable schema-based validation
  enableBusinessRules: true,         // Enable business rule validation
  enableCorrelationTracking: true,   // Enable correlation ID tracking
  logValidationSteps: false,         // Log each validation step
});

// Use custom pipeline
app.post('/api/custom',
  ...validationPipeline.userRegistrationPipeline(),
  handler
);
```

### Per-Middleware Configuration

```javascript
import { 
  createInputSanitizer,
  createDTOValidator,
  createBusinessRuleValidator 
} from './src/middleware/validation-index.js';

// Custom input sanitizer
const customSanitizer = createInputSanitizer({
  enableXSSProtection: true,
  enableSQLInjectionPrevention: true,
  enableHTTPParameterPollution: true,
  logSecurityEvents: true,
  maxFieldSize: 10000,
  maxFieldCount: 100,
});

// Custom DTO validator
const customDTOValidator = createDTOValidator(customSchema, {
  enableSanitization: true,
  enableBusinessRules: true,
  strictMode: false,
  logValidationErrors: true,
  maxValidationErrors: 10,
});

// Custom business rule validator
const customBusinessValidator = createBusinessRuleValidator('job_posting', {
  strictMode: false,
  enableAsyncValidation: true,
  logViolations: true,
  maxAsyncValidationTime: 5000,
});
```

## 🚨 Error Handling

### Validation Error Responses

```javascript
// Input sanitization security violation
{
  "success": false,
  "error": "Invalid input detected",
  "message": "Your request contains potentially harmful content and has been blocked for security reasons.",
  "correlationId": "alignme_1234567890abcdef",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "support": {
    "message": "If you believe this is an error, please contact support with the correlation ID.",
    "email": "security@alignme.com"
  }
}

// DTO validation error
{
  "success": false,
  "error": {
    "message": "Request validation failed",
    "type": "DTO_VALIDATION_ERROR",
    "code": "VALIDATION_FAILED",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address",
        "code": "invalid_string",
        "value": "invalid-email",
        "expected": "valid email format"
      }
    ],
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "correlationId": "alignme_1234567890abcdef"
}

// Business rule violation
{
  "success": false,
  "error": {
    "message": "Business rule validation failed",
    "type": "BUSINESS_RULE_VIOLATION",
    "rule": "job_posting",
    "context": {
      "violations": [
        {
          "rule": "skill_experience_alignment",
          "message": "Entry-level positions should not require extensive advanced technical skills",
          "context": {
            "experienceLevel": "entry",
            "advancedSkills": ["System Architecture", "Microservices"],
            "suggestion": "Consider adjusting required skills or increasing experience level requirement"
          }
        }
      ]
    },
    "timestamp": "2024-01-15T10:30:00.000Z"
  },
  "correlationId": "alignme_1234567890abcdef"
}
```

## 🧪 Testing

### Unit Testing Examples

```javascript
import request from 'supertest';
import express from 'express';
import { validationPipelines } from './src/middleware/validation-index.js';

describe('AlignME Validation Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('User Registration Validation', () => {
    beforeEach(() => {
      app.post('/test/register', 
        ...validationPipelines.userRegistration,
        (req, res) => res.json({ success: true, data: req.validatedData })
      );
    });

    it('should validate correct user registration data', async () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        role: 'job_seeker',
        agreeToTerms: true,
      };

      const response = await request(app)
        .post('/test/register')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('john@example.com');
    });

    it('should reject invalid email format', async () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePass123!',
        role: 'job_seeker',
        agreeToTerms: true,
      };

      const response = await request(app)
        .post('/test/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.details[0].field).toBe('email');
    });

    it('should block XSS attempts', async () => {
      const xssData = {
        name: '<script>alert("XSS")</script>John Doe',
        email: 'john@example.com',
        password: 'SecurePass123!',
        role: 'job_seeker',
        agreeToTerms: true,
      };

      const response = await request(app)
        .post('/test/register')
        .send(xssData)
        .expect(400);

      expect(response.body.error).toMatch(/Invalid input detected/);
    });
  });

  describe('Business Rules Validation', () => {
    beforeEach(() => {
      app.post('/test/job', 
        ...validationPipelines.jobPosting,
        (req, res) => res.json({ success: true, data: req.validatedData })
      );
    });

    it('should detect skill-experience level misalignment', async () => {
      const invalidJob = {
        title: 'Entry Level Software Engineer',
        description: 'Looking for an entry level engineer with basic skills',
        requirements: ['Basic programming knowledge'],
        skills: ['System Architecture', 'Microservices', 'Distributed Systems'],
        employmentType: 'full_time',
        experienceLevel: 'entry',
        location: { city: 'San Francisco', country: 'US', remote: false },
      };

      const response = await request(app)
        .post('/test/job')
        .send(invalidJob)
        .expect(422);

      expect(response.body.error.rule).toBe('job_posting');
      expect(response.body.error.context.violations[0].rule).toBe('skill_experience_alignment');
    });
  });
});
```

## 📈 Performance Considerations

### Optimization Tips

1. **Selective Pipeline Application**: Don't apply all validation layers to every endpoint
2. **Async Validation**: Use async business rules validation judiciously
3. **Caching**: Cache validation results for repeated patterns
4. **Monitoring**: Track validation performance metrics

```javascript
// Selective validation example
app.get('/api/public/search',       // Light validation for public endpoints
  ...validationPipelines.minimal,
  handler
);

app.post('/api/users/register',     // Full validation for critical endpoints
  ...validationPipelines.userRegistration,
  handler
);

// Performance monitoring
app.use((req, res, next) => {
  if (req.validationMetrics) {
    if (req.validationMetrics.duration > 100) { // Log slow validations
      console.log('Slow validation detected:', {
        duration: req.validationMetrics.duration,
        url: req.originalUrl,
        correlationId: req.correlationId,
      });
    }
  }
  next();
});
```

## 🔒 Security Best Practices

1. **Always sanitize first**: Apply input sanitization before other validation
2. **Validate twice**: Use both DTO and business rule validation
3. **Log security events**: Monitor and alert on suspicious patterns
4. **Correlation tracking**: Always use correlation IDs for security investigations
5. **Rate limiting**: Combine with rate limiting middleware for enhanced protection

## 📚 API Reference

See the individual middleware files for complete API documentation:

- [`input-sanitization.js`](./src/middleware/input-sanitization.js) - Input sanitization and XSS/SQL injection protection
- [`dto-validation.js`](./src/middleware/dto-validation.js) - Schema-based data validation
- [`business-rules-validator.js`](./src/middleware/business-rules-validator.js) - AlignME business logic validation
- [`validation-index.js`](./src/middleware/validation-index.js) - Unified validation pipeline management

## 🤝 Support

For questions or issues with the validation middleware:

1. Check the correlation ID in error responses
2. Review validation statistics at `/api/admin/validation-stats`
3. Check application logs for detailed validation events
4. Contact the development team with correlation IDs for investigation
