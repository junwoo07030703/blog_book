import https from 'https';
import fs from 'fs';

const url = 'https://pedia.watcha.com/ko-KR/users/dP8v6ldPrQxWe/contents/books/ratings';
const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
};

https.get(url, options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        fs.writeFileSync('temp_watcha.html', data);
        console.log('Downloaded HTML to temp_watcha.html, size:', data.length);
    });

}).on('error', (err) => {
    console.error('Error:', err.message);
});
