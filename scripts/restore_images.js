
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
const jsonFilePath = path.join(__dirname, '../src/data/books_crawled.json');
const coversDir = path.join(__dirname, '../public/book_covers');

// JSON 데이터 로드
console.log('📖 books_crawled.json 로드 중...');
const rawJson = fs.readFileSync(jsonFilePath, 'utf-8');
const booksData = JSON.parse(rawJson);
const urlMap = new Map();

booksData.forEach(book => {
    // coverImage 또는 thumbnailUrl 사용
    const url = book.coverImage || book.thumbnailUrl;
    if (book.id && url) {
        urlMap.set(String(book.id), url);
    }
});

console.log(`✅ ${urlMap.size}개의 원본 URL 확보`);

// 폴더 확인
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const client = url.startsWith('https') ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.naver.com',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            }
        };

        client.get(url, options, (response) => {
            if (response.statusCode !== 200) {
                // 리다이렉트 처리
                if (response.statusCode === 301 || response.statusCode === 302) {
                    downloadImage(response.headers.location, filepath)
                        .then(resolve)
                        .catch(reject);
                    return;
                }
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
                return;
            }

            // Content-Type 확인 (HTML 등 잘못된 응답 필터링)
            const contentType = response.headers['content-type'];
            if (contentType && !contentType.includes('image')) {
                reject(new Error(`Invalid content type: ${contentType}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log('🔄 books.ts 스캔 및 이미지 재다운로드 시작...');

    // books.ts 줄 단위 읽기
    const content = fs.readFileSync(booksFilePath, 'utf-8');
    const lines = content.split('\n');

    let currentId = null;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // ID 찾기
        const idMatch = line.match(/"id":\s*"([^"]+)"/);
        if (idMatch) {
            currentId = idMatch[1];
        }

        // 로컬 이미지 경로 찾기
        // 예: "coverImage": "/book_covers/cover_0.jpg"
        const imgMatch = line.match(/"coverImage":\s*"\/(book_covers\/[^"]+)"/);

        if (imgMatch && currentId) {
            const localPathRelative = imgMatch[1]; // book_covers/cover_0.jpg
            const fullPath = path.join(__dirname, '../public', localPathRelative);
            const originalUrl = urlMap.get(currentId);

            if (originalUrl) {
                console.log(`⬇️ 재다운로드 시도: ${currentId} -> ${localPathRelative}`);

                // 파일이 이미 존재하고 크기가 1KB 이상이면 스킵할 수도 있으나,
                // 문제가 있다고 했으므로 무조건 덮어쓰거나, 작은 파일만 덮어쓰기
                // 여기선 안전하게 모두 덮어쓰되 딜레이를 줍니다.

                try {
                    await downloadImage(originalUrl, fullPath);
                    // console.log(`   ✅ 성공`);
                    successCount++;
                } catch (err) {
                    console.error(`   ❌ 실패: ${err.message}`);
                    failCount++;
                }

                // 딜레이 (차단 방지)
                await new Promise(r => setTimeout(r, 200));
            } else {
                console.warn(`   ⚠️ 원본 URL 없음: ${currentId}`);
            }

            // ID 초기화 (다음 책을 위해, 사실 필수는 아님)
            // currentId = null; 
        }
    }

    console.log(`\n🎉 완료! 성공: ${successCount}, 실패: ${failCount}`);
}

run();
