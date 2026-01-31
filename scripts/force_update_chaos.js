
import fs from 'fs';
import path from 'path';
import https from 'https';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
const tempFilePath = path.join(__dirname, 'books_temp_chaos.js');
const envPath = path.join(rootDir, '.env');

let TTBKey = '';
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const match = envContent.match(/ALADIN_TTB_KEY=(.*)/);
    if (match) TTBKey = match[1].trim();
}

const targetId = "223504223496";
// 검색어 변경: 전체 제목 대신 핵심 키워드
const query = "카오스";

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

async function updateChaos() {
    console.log('🚀 카오스 강제 업데이트 시작');
    const books = await loadBooks();
    const book = books.find(b => b.id === targetId);

    if (!book) {
        console.log('❌ 카오스 책을 찾을 수 없습니다.');
        return;
    }

    console.log(`🔍 검색 중: ${query} (Original: ${book.title})`);

    // 검색
    const searchUrl = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${TTBKey}&Query=${encodeURIComponent(query)}&QueryType=Title&MaxResults=5&start=1&SearchTarget=Book&Output=JS&Version=20131101`;

    try {
        const result = await fetchJSON(searchUrl);
        if (result.item && result.item.length > 0) {
            // "제임스 글릭" 저자 확인
            const bestMatch = result.item.find(i => i.author.includes('제임스') || i.author.includes('글릭')) || result.item[0];

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
                    let w = detail.subInfo.packing.sizeWidth;
                    let h = detail.subInfo.packing.sizeHeight;
                    if (w > h) { [w, h] = [h, w]; }
                    book.sizeWidth = w;
                    book.sizeHeight = h;
                    book.sizeDepth = detail.subInfo.packing.sizeDepth;
                    book.weight = detail.subInfo.packing.weight;
                }

                // 이미지 가로채기
                const filename = path.basename(book.coverImage);
                const localPath = path.join(rootDir, 'public', 'book_covers', filename);
                const highResCover = detail.cover.replace('coversum', 'cover500');

                await downloadImage(highResCover, localPath);
                console.log(`   🖼️ 이미지 업데이트 완료: ${filename}`);

                book.thumbnailUrl = book.coverImage;

                delete book.spineColor;
                delete book.height;
                delete book.thickness;

                // 저장
                console.log(`\n💾 저장 중...`);
                // (생략: 인터페이스 정의 등 동일)
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
        } else {
            console.log(`   ❌ 검색 실패 (결과 없음)`);
        }
    } catch (e) {
        console.error(e);
    }

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
}

updateChaos();
