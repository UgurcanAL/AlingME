# 🔐 AlignME Job Seeker Login Guide

Having trouble logging in as a job seeker? This guide will help you resolve authentication issues and get access to the AlignME platform.

## 🚀 Quick Fix - Test Login Credentials

### **Available Job Seeker Accounts:**

1. **John Doe** (Job Seeker)
   - **Email:** `john@example.com`
   - **Password:** `password123`
   - **Status:** Active

2. **RealTime User** (Job Seeker)
   - **Email:** `realtime@alignme.com`
   - **Password:** `password123`
   - **Status:** Active

3. **Test User** (Job Seeker)
   - **Email:** `testuser@alignme.com`
   - **Password:** `password123`
   - **Status:** Active

## 🌐 How to Login

### **Option 1: Main Landing Page**

1. Visit: `http://localhost:3000`
2. Click **"Sign In as Job Seeker"**
3. Enter credentials from above
4. Click **"Sign In"**

### **Option 2: Direct Login Page**

1. Visit: `http://localhost:3000/login.html`
2. Enter your email and password
3. Click **"Login"**

### **Option 3: Create New Account**

1. Visit: `http://localhost:3000`
2. Click **"Register as Job Seeker"**
3. Fill out the registration form
4. Use your email and a strong password

## 🔧 Troubleshooting Common Issues

### **Issue 1: "Invalid Email or Password"**

**Solution:**

- Make sure you're using the exact credentials above
- Check for typos in email/password
- Ensure Caps Lock is off

### **Issue 2: "Network Error"**

**Solution:**

- Check if AlignME server is running on port 3000
- Visit `http://localhost:3000/health` to verify server status
- Restart the server: `npm start`

### **Issue 3: "Account Deactivated"**

**Solution:**

- The account may be marked as inactive
- Try a different test account from the list above

### **Issue 4: "Authentication Failed"**

**Solution:**

- Clear browser cache and cookies
- Try in an incognito/private window
- Check browser console for error messages

## 🧪 Test Your Login

Run this command to test authentication:

```bash
node test-login.js
```

This will:

- Test server connectivity
- Try multiple login credentials
- Verify authenticated endpoints
- Create a new test account if needed

## 📊 What You Can Do After Login

Once logged in as a job seeker, you can:

### **Dashboard Access**

- View your profile dashboard
- See job recommendations
- Track application status

### **Job Search**

- Browse available job listings
- Use advanced search filters
- View job details and requirements

### **Applications**

- Apply to jobs with cover letters
- Track application status
- Manage your applications

### **Profile Management**

- Update your profile information
- Add skills and experience
- Upload resume and portfolio

## 🔍 API Endpoints Available

### **Authentication**

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - New user registration
- `POST /api/auth/logout` - User logout

### **Job Seeker Features**

- `GET /api/profile` - Get user profile
- `GET /api/jobs` - List available jobs
- `POST /api/jobs/:id/apply` - Apply for a job
- `GET /api/dashboard` - Dashboard data

## 🚨 Still Having Issues?

### **Server Not Running**

```bash
# Start the AlignME server
npm start

# Or use the VS Code task
# Press Ctrl+Shift+P and run "Tasks: Run Task" -> "🚀 Run AlignME App"
```

### **Dependencies Issues**

```bash
# Reinstall dependencies
npm install

# Clear npm cache
npm cache clean --force
```

### **Port Conflicts**

```bash
# Check if port 3000 is in use
netstat -an | findstr :3000

# Kill processes on port 3000 if needed
npx kill-port 3000
```

## 📞 Need Help?

If you're still experiencing issues:

1. **Check Console Logs:** Open browser DevTools (F12) and check for errors
2. **Server Logs:** Look at the terminal where AlignME is running
3. **Test Script:** Run `node test-login.js` for diagnostic information

## 🎯 Expected Behavior

After successful login, you should:

- See a success message
- Be redirected to the dashboard
- Have access to job seeker features
- See your name in the user interface

---

**Note:** This is a development environment. In production, use secure passwords and proper authentication flows.
