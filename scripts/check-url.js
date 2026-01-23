const https = require('https');
const url = 'https://f005.backblazeb2.com/file/brutal-b2-x93kd/videos/1769199850504_1000080360.mp4';

console.log('Checking:', url);
https.get(url, (res) => {
    console.log('Status:', res.statusCode);
    console.log('Headers:', res.headers);
    res.resume(); // Consume
}).on('error', (e) => console.error('Error:', e));
