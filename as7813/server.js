const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
};

const server = http.createServer((req, res) => {
    // Enable basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Parse URL safely
    let reqUrl = req.url.split('?')[0].split('#')[0];
    if (reqUrl === '/' || reqUrl === '') {
        reqUrl = '/index.html';
    }

    let filePath = path.join(ROOT_DIR, decodeURIComponent(reqUrl));

    // Prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=UTF-8' });
        res.end('403 Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            // Check if adding .html resolves it
            const htmlCandidate = filePath + '.html';
            if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) {
                filePath = htmlCandidate;
            } else {
                // Fallback to index.html for SPA/root routes or return 404
                const defaultIndex = path.join(ROOT_DIR, 'index.html');
                if (fs.existsSync(defaultIndex)) {
                    filePath = defaultIndex;
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
                    res.end('404 Not Found');
                    return;
                }
            }
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        fs.readFile(filePath, (readErr, data) => {
            if (readErr) {
                res.writeHead(500, { 'Content-Type': 'text/plain; charset=UTF-8' });
                res.end('500 Server Error');
                return;
            }

            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        // Port is already in use by another instance - that's OK!
        console.log(`Server is running at: http://localhost:${PORT}`);
        console.log(`Serving files from: ${ROOT_DIR}`);
        // Keep process alive so VS Code task doesn't fail
        setInterval(() => {}, 1000 * 60 * 60);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

server.listen(PORT, () => {
    console.log(`Server is running at: http://localhost:${PORT}`);
    console.log(`Serving files from: ${ROOT_DIR}`);
});
