/\*\*

- AlignME API Migration Guide
- Migrating from legacy API calls to centralized AlignMEAPI client
- CRITICAL: Use this to update all frontend JavaScript files
  \*/

// OLD WAY (Multiple inconsistencies)
/\*
// Different token keys
localStorage.getItem('jwt')
localStorage.getItem('alignme_token')
localStorage.getItem('token')

// Different base URLs
fetch('/api/v1/jobs') // WRONG - backend serves /api/jobs
fetch('/api/jobs') // CORRECT

// Inconsistent error handling
if (response.ok) {
const data = await response.json();
if (data.success) {
// Handle success
}
}

// Manual retry logic
for (let attempt = 0; attempt < 3; attempt++) {
try {
const response = await fetch(url);
// ...
} catch (error) {
// ...
}
}
\*/

// NEW WAY (Centralized & Consistent)

// 1. AUTHENTICATION
// Replace all login functions with:
async function loginUser(credentials) {
try {
const result = await AlignMEAPI.login(credentials);

    if (result.success) {
      // Token is automatically stored
      // User data available in result.data.user
      console.log('Login successful:', result.data.user);

      // Navigate to dashboard
      window.location.href = '/dashboard.html';

      return result;
    } else {
      throw new Error(result.error || 'Login failed');
    }

} catch (error) {
console.error('Login error:', error);
showToast(error.message, 'danger');
throw error;
}
}

// 2. JOB APPLICATIONS
// Replace fetch('/api/jobs/apply') with:
async function applyToJob(jobId, applicationData = {}) {
try {
const result = await AlignMEAPI.applyToJob(jobId, applicationData);

    if (result.success) {
      showToast('Application submitted successfully!', 'success');
      return result;
    } else {
      throw new Error(result.error || 'Application failed');
    }

} catch (error) {
console.error('Application error:', error);
showToast(error.message, 'danger');
throw error;
}
}

// 3. PROFILE UPDATES
// Replace manual profile API calls with:
async function updateUserProfile(profileData) {
try {
const result = await AlignMEAPI.updateProfile(profileData);

    if (result.success) {
      showToast('Profile updated successfully!', 'success');
      return result.data;
    } else {
      throw new Error(result.error || 'Profile update failed');
    }

} catch (error) {
console.error('Profile update error:', error);
showToast(error.message, 'danger');
throw error;
}
}

// 4. SEARCH FUNCTIONALITY
// Replace manual search calls with:
async function searchJobs(query, filters = {}) {
try {
const result = await AlignMEAPI.search(query, 'jobs', filters);

    if (result.success) {
      return result.data.jobs || [];
    } else {
      throw new Error(result.error || 'Search failed');
    }

} catch (error) {
console.error('Search error:', error);
showToast('Search failed. Please try again.', 'warning');
return [];
}
}

// 5. FILE UPLOADS
// Replace manual FormData handling with:
async function uploadProfilePicture(file) {
try {
const result = await AlignMEAPI.uploadAvatar(file);

    if (result.success) {
      showToast('Profile picture updated!', 'success');
      return result.data.avatarUrl;
    } else {
      throw new Error(result.error || 'Upload failed');
    }

} catch (error) {
console.error('Upload error:', error);
showToast(error.message, 'danger');
throw error;
}
}

// 6. EVENT LISTENERS FOR API EVENTS
// Listen for authentication events
window.addEventListener('alignme:auth:expired', () => {
showToast('Session expired. Please log in again.', 'warning');
window.location.href = '/';
});

window.addEventListener('alignme:auth:login', (event) => {
console.log('User logged in:', event.detail);
// Update UI for authenticated state
});

window.addEventListener('alignme:auth:logout', () => {
console.log('User logged out');
// Clear UI state
window.location.href = '/';
});

// 7. MIGRATION CHECKLIST
/\*
FILES TO UPDATE:

1. /public/js/app.js
   - Replace localStorage.getItem('jwt') with AlignMEAPI.getToken()
   - Replace manual fetch calls with AlignMEAPI methods
   - Update login/register functions

2. /public/js/jobs.js
   - Replace job application fetch with AlignMEAPI.applyToJob()
   - Update job listing fetch with AlignMEAPI.getJobs()

3. /public/js/profile.js
   - Replace profile fetch with AlignMEAPI.getProfile()
   - Replace update calls with AlignMEAPI.updateProfile()

4. /public/js/main.js
   - Update authentication token handling

5. /public/js/advanced-search.js
   - Replace search fetch with AlignMEAPI.search()

6. /public/js/time-logs.js
   - Replace time log APIs with AlignMEAPI.getTimeLogs(), etc.

7. /public/js/moderation.js
   - Update moderation API calls

SEARCH & REPLACE PATTERNS:

Replace:
localStorage.getItem('jwt')
localStorage.getItem('token')
With:
AlignMEAPI.getToken()

Replace:
localStorage.setItem('jwt', token)
With:
AlignMEAPI.setToken(token)

Replace:
fetch('/api/v1/
With:
fetch('/api/

Replace:
'Authorization': `Bearer ${localStorage.getItem('jwt') || localStorage.getItem('alignme_token')}`
With:
// Remove this - AlignMEAPI handles auth headers automatically

\*/

console.log('📋 AlignME API Migration Guide loaded - Follow checklist above');

// EXAMPLE: Complete login form with new API
/\*

<form id="loginForm">
  <input type="email" id="email" required>
  <input type="password" id="password" required>
  <button type="submit">Login</button>
</form>

<script>
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const credentials = {
    email: document.getElementById('email').value,
    password: document.getElementById('password').value
  };

  try {
    await loginUser(credentials);
  } catch (error) {
    // Error already handled in loginUser function
  }
});
</script>

\*/
