
/**
 * Simple HTTP server with proper UTF-8 encoding
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) =&gt; {
  console.log(`${req.method} ${req.url}`);

  // Build file path
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) =&gt; {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    // Check if it's a directory
    fs.stat(filePath, (err, stats) =&gt; {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('500 Server Error');
        return;
      }

      if (stats.isDirectory()) {
        // Directory - try index.html
        filePath = path.join(filePath, 'index.html');
      }

      // Get file extension
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';

      // Read and serve file
      fs.readFile(filePath, (err, content) =&gt; {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('500 Server Error');
          return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });
  });
});

server.listen(PORT, () =&gt; {
  console.log('='.repeat(60));
  console.log('🚀 Pixel Agents Demo Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📂 Serving from: ${__dirname}`);
  console.log('='.repeat(60));
  console.log('Press Ctrl+C to stop');
  console.log('='.repeat(60));
});

