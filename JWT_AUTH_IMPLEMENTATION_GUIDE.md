# 🔐 AlignME JWT Authentication & Authorization Implementation Guide

## Overview

This implementation provides comprehensive JWT-based authentication middleware with role-based access control and resource ownership verification for the AlignME platform.

## 🚀 Key Features Implemented

### 1. Enhanced JWT Authentication
- ✅ Secure JWT token generation with configurable expiration
- ✅ Role-based permissions with fine-grained access control
- ✅ Refresh token mechanism for long-lived sessions
- ✅ Comprehensive token validation and error handling

### 2. Role-Based Access Control (RBAC)
- ✅ Predefined roles: `admin`, `moderator`, `employer`, `seeker`, `guest`
- ✅ Permission-based authorization for specific actions
- ✅ Granular control over portfolio and project operations
- ✅ Admin and moderator override capabilities

### 3. Resource Ownership Verification
- ✅ Project ownership verification with collaborator support
- ✅ Portfolio ownership validation
- ✅ Profile ownership checks
- ✅ Collaborative access with permission levels

## 📁 New Files Created

### Core Middleware Files
1. **`src/middleware/ownership.ts`** - Resource ownership verification
2. **`src/routes/portfolios.ts`** - Secure portfolio routes
3. **`src/routes/projects.ts`** - Secure project routes

### Enhanced Existing Files
1. **`src/middleware/permissions.ts`** - Extended with portfolio/project permissions
2. **`src/middleware/auth.ts`** - Enhanced with granular authorization
3. **`src/types/express.d.ts`** - Added permissions to RequestUser interface

## 🛡️ Security Implementation

### Authentication Middleware Usage

```typescript
import { AuthMiddleware } from '../middleware/auth.js';
import { verifyProjectOwnership, verifyPortfolioOwnership } from '../middleware/ownership.js';
import { acl } from '../middleware/permissions.js';

// Basic authentication
router.use(AuthMiddleware.authenticate);

// Role-based authorization
router.get('/admin-only', AuthMiddleware.authorize(['admin']), handler);

// Permission-based authorization
router.post('/portfolios', acl.portfolio.create, handler);

// Resource ownership verification
router.put('/projects/:id', 
  acl.projects.update,
  verifyProjectOwnership({ allowCollaborators: true }),
  handler
);
```

### Ownership Verification Examples

```typescript
// Project ownership with collaborator access
verifyProjectOwnership({
  allowCollaborators: true,  // Allow active collaborators
  allowAdmins: true,         // Admin override
  allowModerators: false,    // No moderator access
  resourceIdParam: 'id'      // Parameter name for project ID
})

// Portfolio ownership (owner only)
verifyPortfolioOwnership({
  allowAdmins: true,         // Admin override
  resourceIdParam: 'portfolioId'
})
```

## 🔑 Permission Matrix

### Roles and Permissions

| Role | Portfolio | Projects | Admin | Moderation |
|------|-----------|----------|-------|------------|
| **Admin** | All permissions | All permissions | Full access | Full access |
| **Moderator** | Read only | Read only | Analytics | Full moderation |
| **Employer** | Full (own) | Full (own) | None | None |
| **Seeker** | Full (own) | Full (own) | None | None |
| **Guest** | Read public | Read public | None | None |

### Collaborative Permissions

Projects support collaborative access with permission levels:
- **view**: Read project details
- **comment**: Add comments and feedback
- **edit**: Modify project content
- **manage**: Add/remove collaborators
- **admin**: Full project control

## 📚 Route Security Examples

### Portfolio Routes
```typescript
// GET /api/portfolios - Read own portfolio
router.get('/', acl.portfolio.read, handler);

// PUT /api/portfolios/:id - Update own portfolio
router.put('/:id', 
  acl.portfolio.update,
  verifyPortfolioOwnership({ allowAdmins: true }),
  handler
);

// DELETE /api/portfolios/:id - Delete own portfolio
router.delete('/:id',
  acl.portfolio.delete,
  verifyPortfolioOwnership({ allowAdmins: true }),
  handler
);
```

### Project Routes
```typescript
// POST /api/portfolios/projects - Create project in own portfolio
router.post('/projects', acl.projects.create, handler);

// PUT /api/projects/:id - Update project (owner + collaborators)
router.put('/:id',
  acl.projects.update,
  verifyProjectOwnership({ 
    allowCollaborators: true,
    allowAdmins: true 
  }),
  handler
);

// DELETE /api/projects/:id - Delete project (owner only)
router.delete('/:id',
  acl.projects.delete,
  verifyProjectOwnership({ 
    allowCollaborators: false, // Only owners can delete
    allowAdmins: true 
  }),
  handler
);
```

## 🔧 Configuration

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secure-secret-key-here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=7d

# Security Settings
NODE_ENV=production
```

### Token Structure
```typescript
interface TokenPayload {
  userId: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  isEmailVerified: boolean;
  iat?: number;
  exp?: number;
}
```

## 🚨 Error Handling

### Authentication Errors
```typescript
// Missing token
{
  success: false,
  error: 'Access token required',
  code: 'NO_TOKEN'
}

// Invalid token
{
  success: false,
  error: 'Invalid or expired access token',
  code: 'AUTH_FAILED'
}
```

### Authorization Errors
```typescript
// Insufficient role
{
  success: false,
  error: 'Access denied. Required role: admin or employer',
  code: 'INSUFFICIENT_PERMISSIONS'
}

// Ownership violation
{
  success: false,
  error: 'Access denied - you can only modify your own projects',
  code: 'PROJECT_OWNERSHIP_REQUIRED'
}
```

## 🧪 Testing Examples

### Authentication Tests
```javascript
// Test authentication middleware
describe('AuthMiddleware', () => {
  it('should authenticate valid JWT token', async () => {
    const token = AuthMiddleware.generateAccessToken(mockUser);
    const req = { headers: { authorization: `Bearer ${token}` } };
    await AuthMiddleware.authenticate(req, res, next);
    expect(req.user).toBeDefined();
  });
});
```

### Ownership Tests
```javascript
// Test project ownership
describe('Project Ownership', () => {
  it('should allow project owner to update', async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Updated Title' })
      .expect(200);
  });

  it('should deny non-owner from updating', async () => {
    await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${nonOwnerToken}`)
      .send({ title: 'Updated Title' })
      .expect(403);
  });
});
```

## 🔄 Migration Guide

### Updating Existing Routes

1. **Add authentication middleware:**
```typescript
// Before
router.get('/projects', handler);

// After
router.get('/projects', AuthMiddleware.authenticate, acl.projects.read, handler);
```

2. **Add ownership verification:**
```typescript
// Before
router.put('/projects/:id', handler);

// After
router.put('/projects/:id',
  acl.projects.update,
  verifyProjectOwnership({ allowCollaborators: true }),
  handler
);
```

3. **Update error handling:**
```typescript
// Enhanced error responses with proper codes
if (!req.user) {
  return res.status(401).json({
    success: false,
    error: 'Authentication required',
    code: 'AUTH_REQUIRED'
  });
}
```

## 📈 Security Best Practices

### 1. Token Security
- ✅ Use strong, unique JWT secrets in production
- ✅ Implement token rotation and refresh mechanisms
- ✅ Set appropriate expiration times
- ✅ Use HTTPS for all token exchanges

### 2. Permission Validation
- ✅ Validate permissions on both frontend and backend
- ✅ Use least privilege principle
- ✅ Implement role hierarchy (admin > moderator > user)
- ✅ Log all authorization decisions

### 3. Ownership Verification
- ✅ Always verify resource ownership before mutations
- ✅ Support collaborative access where appropriate
- ✅ Implement admin overrides for support scenarios
- ✅ Audit ownership changes

### 4. Error Handling
- ✅ Provide clear, actionable error messages
- ✅ Use consistent error codes
- ✅ Log security events for monitoring
- ✅ Don't leak sensitive information in errors

## 🎯 Next Steps

1. **Testing**: Implement comprehensive test suites for all middleware
2. **Monitoring**: Add security event logging and monitoring
3. **Rate Limiting**: Implement API rate limiting for auth endpoints
4. **Audit Trail**: Add detailed audit logging for sensitive operations
5. **Multi-Factor Auth**: Consider implementing MFA for admin accounts

## 📞 Support

For questions or issues with the authentication system:
1. Check the error codes in the response
2. Verify JWT token validity
3. Confirm user roles and permissions
4. Review ownership verification logs

This implementation provides a robust, secure foundation for AlignME's authentication and authorization needs while maintaining flexibility for future enhancements.
