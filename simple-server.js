import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 3000;

// Simple HTML template
const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AlignME - Professional Networking Platform</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 600px;
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5em;
        }
        p {
            color: #666;
            font-size: 1.2em;
            margin-bottom: 30px;
        }
        .status {
            background: #4CAF50;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 20px;
        }
        .features {
            text-align: left;
            margin: 30px 0;
        }
        .features ul {
            list-style: none;
            padding: 0;
        }
        .features li {
            padding: 10px 0;
            border-bottom: 1px solid #eee;
        }
        .features li:before {
            content: "✓";
            color: #4CAF50;
            font-weight: bold;
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">🚀 Server Running Successfully!</div>
        <h1>Welcome to AlignME</h1>
        <p>Professional networking and job matching platform is now running on localhost:3000</p>
        
        <div class="features">
            <h3>Available Features:</h3>
            <ul>
                <li>Professional Profile Management</li>
                <li>AI-Powered Job Matching</li>
                <li>Real-time Messaging</li>
                <li>Portfolio Showcase</li>
                <li>Advanced Search & Filtering</li>
                <li>Analytics Dashboard</li>
            </ul>
        </div>
        
        <p><strong>Server Status:</strong> ✅ Active<br>
        <strong>Port:</strong> ${port}<br>
        <strong>Environment:</strong> Development</p>
    </div>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlTemplate);
    } else if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            port: port
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(`
            <html>
                <body style="font-family: Arial; text-align: center; margin-top: 100px;">
                    <h1>404 - Page Not Found</h1>
                    <p>The requested URL was not found on this server.</p>
                    <a href="/">← Back to Home</a>
                </body>
            </html>
        `);
    }
});

server.listen(port, () => {
    console.log(`
🚀 AlignME Server Successfully Started!

📍 Server running at: http://localhost:${port}
🌐 Open in browser: http://localhost:${port}
📊 Health check: http://localhost:${port}/api/health

📝 Server Info:
   - Environment: Development
   - Node.js Version: ${process.version}
   - Platform: ${process.platform}
   - Architecture: ${process.arch}

✨ Ready to serve requests!
    `);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use. Try a different port or kill the existing process.`);
        console.error(`💡 To kill process using port ${port}:`);
        console.error(`   netstat -ano | findstr :${port}`);
        console.error(`   taskkill /PID <PID> /F`);
    } else {
        console.error('❌ Server error:', err);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server gracefully...');
    server.close(() => {
        console.log('✅ Server closed successfully');
        process.exit(0);
    });
});
