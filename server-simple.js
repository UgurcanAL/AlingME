import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Define a reusable function to render pages
const renderPage = (req, res, pageName, title) => {
  res.render(pageName, {
    title: title,
  });
};

// Route for the main page
app.get('/', (req, res) => {
  renderPage(req, res, 'home', 'Welcome to AlignME');
});

// Dynamically create routes for all .ejs files in the views directory
const viewsDir = path.join(__dirname, 'views');

try {
  fs.readdirSync(viewsDir).forEach((file) => {
    if (file.endsWith('.ejs')) {
      const pageName = path.basename(file, '.ejs');
      // Skip partials
      if (pageName.startsWith('_')) {
        return;
      }

      const routePath = `/${pageName}`;
      const pageTitle = `${pageName.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}`;

      app.get(routePath, (req, res) => {
        renderPage(req, res, pageName, pageTitle);
      });
    }
  });
} catch (error) {
  console.error('Error reading views directory:', error.message);
}

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).send('Internal server error');
});

app.listen(port, () => {
  console.log(`🚀 Simple AlignME Server is running on http://localhost:${port}`);
  console.log(`🏠 Homepage available at http://localhost:${port}/`);
  console.log(`🩺 Health check: http://localhost:${port}/health`);
});
