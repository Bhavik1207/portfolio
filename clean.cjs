const fs = require('fs');

// Clean HTML
let html = fs.readFileSync('index.html', 'utf8');
// Add security rel tags to all target="_blank" links
html = html.replace(/target="_blank"(?!\s*rel=)/g, 'target="_blank" rel="noopener noreferrer"');
// Clean comments
html = html.replace(/<!-- ═+.*?═+ -->/g, '');
html = html.replace(/<!-- ──.*?── -->/g, '');

// Add Security Headers
const cspHeader = `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self';">`;

if (!html.includes('Content-Security-Policy')) {
  html = html.replace('</title>', '</title>\n  ' + cspHeader);
}

fs.writeFileSync('index.html', html);
console.log('Cleaned index.html');
