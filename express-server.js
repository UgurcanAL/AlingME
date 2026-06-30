import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Favicon: redirect to SVG (works in modern browsers); add a real .ico later if needed
app.get('/favicon.ico', (req, res) => {
    res.redirect(302, '/favicon.svg');
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Home route - render the index.ejs file
app.get('/', (req, res) => {
    console.log('📍 Attempting to render index.ejs...');
    console.log('Views path:', app.get('views'));
    
    try {
        res.render('index', {
            title: 'AlignME - Professional Networking Platform',
            user: null
        });
        console.log('✅ Successfully rendered index.ejs');
    } catch (error) {
        console.error('❌ Error rendering index.ejs:', error);
        res.status(500).send(`
            <div style="font-family: Arial; padding: 40px; background: #f5f5f5;">
                <h1 style="color: #d32f2f;">Template Rendering Error</h1>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3>Error Details:</h3>
                    <p><strong>Message:</strong> ${error.message}</p>
                    <p><strong>Views Path:</strong> ${app.get('views')}</p>
                    <p><strong>Template:</strong> index.ejs</p>
                </div>
                <div style="margin-top: 30px;">
                    <a href="/simple" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Try Simple Version</a>
                    <a href="/api/health" style="background: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Health Check</a>
                </div>
            </div>
        `);
    }
});

// Simple test route
app.get('/simple', (req, res) => {
    console.log('📍 Serving simple test page...');
    res.send(`
        <html>
            <head>
                <title>AlignME - Server Test</title>
                <style>
                    body { font-family: 'Segoe UI', Arial; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
                    .container { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); max-width: 600px; }
                    .success { color: #4CAF50; font-size: 24px; }
                    .info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
                    .button { background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 10px 10px 0; }
                    .button:hover { background: #1565c0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🚀 AlignME Express Server</h1>
                    <p class="success">✅ Express server is running successfully!</p>
                    <div class="info">
                        <p><strong>Server Info:</strong></p>
                        <ul>
                            <li><strong>Views Path:</strong> ${app.get('views')}</li>
                            <li><strong>View Engine:</strong> ${app.get('view engine')}</li>
                            <li><strong>Port:</strong> ${port}</li>
                            <li><strong>Node.js:</strong> ${process.version}</li>
                            <li><strong>Platform:</strong> ${process.platform}</li>
                        </ul>
                    </div>
                    <p>
                        <a href="/" class="button">🏠 Try Main Page (EJS)</a>
                        <a href="/api/health" class="button">📊 Health Check</a>
                    </p>
                    <p><small>If the main page shows errors, check the browser console and server logs for details.</small></p>
                </div>
            </body>
        </html>
    `);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('📍 Health check requested...');
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: port,
        viewEngine: app.get('view engine'),
        viewsPath: app.get('views'),
        staticPath: path.join(__dirname, 'public'),
        nodeVersion: process.version,
        platform: process.platform
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).send(`
        <div style="font-family: Arial; padding: 40px; text-align: center;">
            <h1>🚨 Server Error</h1>
            <p><strong>Error:</strong> ${err.message}</p>
            <a href="/simple" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Simple Test Page</a>
        </div>
    `);
});

// 404 handler
app.use((req, res) => {
    console.log(`❌ 404 - Not found: ${req.url}`);
    res.status(404).send(`
        <html>
            <body style="font-family: 'Segoe UI', Arial; text-align: center; margin-top: 100px; background: #f5f5f5; min-height: 100vh;">
                <div style="background: white; max-width: 500px; margin: 0 auto; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h1 style="color: #d32f2f;">404 - Page Not Found</h1>
                    <p>The requested URL <code style="background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">${req.url}</code> was not found.</p>
                    <div style="margin-top: 30px;">
                        <a href="/" style="background: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">🏠 Home</a>
                        <a href="/simple" style="background: #388e3c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">🔧 Simple Test</a>
                    </div>
                </div>
            </body>
        </html>
    `);
});

// Start the server
app.listen(port, () => {
    console.log(`
🚀 AlignME Express Server Started Successfully!

📍 Server running at: http://localhost:${port}
🌐 Main page (EJS): http://localhost:${port}/
🔧 Simple test: http://localhost:${port}/simple
📊 Health check: http://localhost:${port}/api/health

📝 Server Configuration:
   - View Engine: ${app.get('view engine')}
   - Views Path: ${app.get('views')}
   - Static Files: ${path.join(__dirname, 'public')}
   - Node.js: ${process.version}
   - Platform: ${process.platform}

✨ Ready to serve your EJS templates!
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down Express server gracefully...');
    process.exit(0);
});

export default app;
