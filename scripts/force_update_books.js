
import fs from 'fs';
import path from 'path';
import https from 'https';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
const tempFilePath = path.join(__dirname, 'books_temp_force_v2.js');
const envPath = path.join(rootDir, '.env');

// .env 로드
let TTBKey = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/ALADIN_TTB_KEY=(.*)/);
    if (match) TTBKey = match[1].trim();
}

if (!TTBKey) {
    console.error('❌ .env 파일에서 ALADIN_TTB_KEY를 찾을 수 없습니다.');
    process.exit(1);
}

// 2차 타겟 (숨, 카오스, 홀, 말투)
const targetIds = [
    "223322534906", // 숨
    "223504223496", // 카오스
    "223504223866", // 홀
    "223728971350"  // 모든 관계는 말투에서 시작된다
];

async function loadBooks() {
    let content = fs.readFileSync(booksFilePath, 'utf-8');
    content = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');
    content = content.replace(/:\s*Book\[\]/, '');
    fs.writeFileSync(tempFilePath, content);
    const { books } = await import(pathToFileURL(tempFilePath).href);
    return books;
}

function fetchJSON(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
}

async function forceUpdate() {
    console.log('🚀 책 데이터 2차 강제 업데이트 시작 (대상: 4권)');
    const books = await loadBooks();

    let updatedCount = 0;

    for (const book of books) {
        if (!targetIds.includes(book.id)) continue;

        console.log(`\n🔍 검색 중: ${book.title} (${book.author})`);

        // 검색 (제목으로만)
        const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTBKey}&Query=${encodeURIComponent(book.title)}&QueryType=Title&MaxResults=1&start=1&SearchTarget=Book&Output=JS&Version=20131101`;

        try {
            const result = await fetchJSON(searchUrl);
            if (result.item && result.item.length > 0) {
                const bestMatch = result.item[0]; // 무조건 1순위 선택
                console.log(`   ✅ 매칭 성공: ${bestMatch.title} (${bestMatch.author})`);

                // 상세 조회
                const lookUpUrl = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${TTBKey}&itemIdType=ISBN13&ItemId=${bestMatch.isbn13}&Output=JS&Version=20131101&OptResult=packing`;
                const detailResult = await fetchJSON(lookUpUrl);

                if (detailResult.item && detailResult.item.length > 0) {
                    const detail = detailResult.item[0];

                    // 데이터 업데이트
                    book.isbn = detail.isbn13;
                    book.category = detail.categoryName.split('>')[1] || detail.categoryName;

                    if (detail.subInfo && detail.subInfo.packing) {
                        book.pageCount = detail.subInfo.itemPage;
                        // 가로/세로 검증 로직
                        let w = detail.subInfo.packing.sizeWidth;
                        let h = detail.subInfo.packing.sizeHeight;
                        if (w > h) { [w, h] = [h, w]; }
                        book.sizeWidth = w;
                        book.sizeHeight = h;
                        book.sizeDepth = detail.subInfo.packing.sizeDepth;
                        book.weight = detail.subInfo.packing.weight;
                    }

                    // 이미지 다운로드 (덮어쓰기)
                    const filename = path.basename(book.coverImage);
                    const localPath = path.join(rootDir, 'public', 'book_covers', filename);

                    // 고화질 이미지 URL
                    const highResCover = detail.cover.replace('coversum', 'cover500');

                    await downloadImage(highResCover, localPath);
                    console.log(`   🖼️ 이미지 업데이트 완료: ${filename}`);

                    book.thumbnailUrl = book.coverImage; // 통일

                    delete book.spineColor;
                    delete book.height;
                    delete book.thickness;

                    updatedCount++;
                }
            } else {
                console.log(`   ❌ 검색 실패 (결과 없음)`);
            }
        } catch (err) {
            console.error(`   ⚠️ 에러 발생:`, err);
        }
    }

    if (updatedCount > 0) {
        console.log(`\n💾 저장 중... (총 ${updatedCount}권 업데이트)`);
        const interfaceDef = `export interface Book {
  id: string;
  title: string;
  author: string;
  publisher: string;
  category: string;
  blogCategory: string;
  pageCount: number;
  sizeWidth: number;
  sizeHeight: number;
  sizeDepth: number;
  weight: number;
  coverImage: string;
  isbn: string;
  readDate: string;
  contentHtml: string;
  tags: string[];
  thumbnailUrl: string;
}`;
        const fileContent = `${interfaceDef}\n\nexport const books: Book[] = ${JSON.stringify(books, null, 2)};\n`;
        fs.writeFileSync(booksFilePath, fileContent, 'utf-8');
        console.log('✨ 완료!');
    }

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
}

forceUpdate();
