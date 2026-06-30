import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Set the directory for your EJS templates
app.set('views', path.join(__dirname, 'views'));

// Serve static files (like CSS and client-side JS)
app.use(express.static(path.join(__dirname, 'public')));

// Add debugging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Define a route to render your index.ejs file
app.get('/', (req, res) => {
  console.log('Root route hit! Attempting to render index.ejs');
  try {
    res.render('index', { title: 'Welcome to AlignME' });
  } catch (error) {
    console.error('Error rendering index.ejs:', error);
    res.status(500).send(`
            <h1>Error rendering EJS template</h1>
            <pre>${error.message}</pre>
            <h2>Debug Info:</h2>
            <ul>
                <li>Views directory: ${path.join(__dirname, 'views')}</li>
                <li>Template file: ${path.join(__dirname, 'views', 'index.ejs')}</li>
                <li>Static files: ${path.join(__dirname, 'public')}</li>
            </ul>
            <p><a href="/status">Check Server Status</a></p>
        `);
  }
});

// Add a simple status route
app.get('/status', (req, res) => {
  console.log('Status route hit!');
  res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>AlignME - Server Status</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
                h1 { color: #003b6f; }
                .status { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <h1>🎯 AlignME Server Status</h1>
            <div class="status">
                <strong>✅ Server:</strong> Running successfully<br>
                <strong>🕒 Time:</strong> ${new Date().toLocaleString()}<br>
                <strong>📁 Static Files:</strong> ${path.join(__dirname, 'public')}<br>
                <strong>👁️ Views:</strong> ${path.join(__dirname, 'views')}<br>
                <strong>🎨 EJS Engine:</strong> Configured<br>
            </div>
            <p><a href="/">🏠 Try Home Page</a> | <a href="/test">🧪 Test API</a></p>
        </body>
        </html>
    `);
});

// Add test route for debugging
app.get('/test', (req, res) => {
  res.json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    paths: {
      views: path.join(__dirname, 'views'),
      public: path.join(__dirname, 'public'),
      root: __dirname
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).send(`<h1>Something went wrong!</h1><pre>${err.message}</pre>`);
});

// Catch 404
app.use((req, res) => {
  console.log('404 - Not found:', req.url);
  res.status(404).send('<h1>Page not found</h1><p>The requested page could not be found.</p>');
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 AlignME Server is running at http://localhost:${port}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'public')}`);
  console.log(`👁️  Views directory: ${path.join(__dirname, 'views')}`);
  console.log(`🎯 Ready to handle requests!`);
});
