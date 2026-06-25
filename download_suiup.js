const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.github.com/repos/MystenLabs/suiup/releases/latest';

https.get(API_URL, { headers: { 'User-Agent': 'Node.js' } }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const json = JSON.parse(body);
    const asset = json.assets.find(a => a.name.includes('Windows'));
    if (!asset) return console.error('No Windows asset found');
    
    console.log('Downloading from:', asset.browser_download_url);
    const file = fs.createWriteStream('suiup.zip');
    https.get(asset.browser_download_url, { headers: { 'User-Agent': 'Node.js' } }, (downloadRes) => {
        // GitHub redirects
        if (downloadRes.statusCode === 302 || downloadRes.statusCode === 301) {
            https.get(downloadRes.headers.location, { headers: { 'User-Agent': 'Node.js' } }, (redirectRes) => {
                redirectRes.pipe(file);
                redirectRes.on('end', () => console.log('Download complete.'));
            });
        } else {
            downloadRes.pipe(file);
            downloadRes.on('end', () => console.log('Download complete.'));
        }
    });
  });
}).on('error', console.error);
