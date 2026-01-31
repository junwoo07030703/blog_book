
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
const coversDir = path.join(__dirname, '../public/book_covers');

// 폴더 생성
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

async function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        const client = url.startsWith('https') ? https : http;

        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
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
    console.log('📚 books.ts에서 이미지 URL 추출 및 다운로드 시작...');

    let content = fs.readFileSync(booksFilePath, 'utf-8');

    // coverImage: "https://..." 또는 "coverImage": "https://..." 패턴 찾기
    const regex = /["']?coverImage["']?:\s*["'](https?:\/\/[^"']+)["']/g;
    let match;
    const replacements = [];
    let count = 0;

    while ((match = regex.exec(content)) !== null) {
        const fullMatch = match[0];
        const url = match[1];

        // 이미 로컬 경로인 경우 패스 (예: /book_covers/...)
        if (url.startsWith('/')) continue;

        // 파일 확장자 추출 (없으면 .jpg 가정)
        let ext = path.extname(url).split('?')[0];
        if (!ext || ext.length > 5) ext = '.jpg';

        // 고유 파일명 생성
        const filename = `cover_${count}${ext}`;
        const filepath = path.join(coversDir, filename);
        const localPath = `/book_covers/${filename}`;

        console.log(`⬇️ 다운로드 (${count + 1}): ${url} -> ${localPath}`);

        try {
            await downloadImage(url, filepath);
            replacements.push({ original: url, replacement: localPath });
            count++;
        } catch (err) {
            console.error(`❌ 다운로드 실패: ${url}`, err.message);
        }

        // 너무 빠른 요청 방지
        await new Promise(r => setTimeout(r, 200));
    }

    // 파일 내용 치환
    if (replacements.length > 0) {
        console.log(`\n📝 books.ts 파일 업데이트 중 (${replacements.length}건)...`);

        // replaceAll 대신 반복문으로 안전하게 치환 (단순 문자열 치환)
        for (const rep of replacements) {
            // URL에 특수문자가 있을 수 있으므로 split/join 사용
            content = content.split(rep.original).join(rep.replacement);
        }

        fs.writeFileSync(booksFilePath, content, 'utf-8');
        console.log('✅ 완료! books.ts가 업데이트되었습니다.');
    } else {
        console.log('✨ 업데이트할 이미지가 없습니다.');
    }
}

run();
