
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
const coversDir = path.join(rootDir, 'public/book_covers');
const envFilePath = path.join(rootDir, '.env');

// =================================================================
// 🔑 환경 변수 로드 (.env)
// =================================================================
let ALADIN_TTB_KEY = '';

if (fs.existsSync(envFilePath)) {
    console.log('📄 .env 파일 발견. 환경 변수를 로드합니다.');
    const envContent = fs.readFileSync(envFilePath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
        if (match && match[1] === 'ALADIN_TTB_KEY') {
            ALADIN_TTB_KEY = (match[2] || '').split('#')[0].trim();
        }
    });
} else {
    console.warn('⚠️ .env 파일이 없습니다.');
}

if (ALADIN_TTB_KEY) {
    console.log(`✅ 알라딘 API 키 로드 완료. ("${ALADIN_TTB_KEY}")`);
} else {
    console.error('❌ ALADIN_TTB_KEY가 없습니다.');
}

if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });

// ------------------------------------------------------------------
// 1. books.ts -> Import 가능한 JS로 변환 및 로드
// ------------------------------------------------------------------
async function loadBooks() {
    const tempFilePath = path.join(__dirname, 'books_temp.js');
    try {
        let content = fs.readFileSync(booksFilePath, 'utf-8');

        // 1. interface 제거 (단순 무식하게 interface 블록을 지우기보다 주석처리하거나, 줄 단위로 날림)
        // 여기선 export interface ... } 블록을 찾아서 제거 시도
        // 정규식: export interface Book { ... } (비탐욕적)
        content = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');

        // 2. 타입 명시 (: Book[]) 제거
        content = content.replace(/:\s*Book\[\]/, '');

        // 3. TS 전용 문법이 혹시 있다면... (여기선 없을 듯)

        fs.writeFileSync(tempFilePath, content);

        // Dynamic Import
        const module = await import(pathToFileURL(tempFilePath).href);
        return module.books;

    } catch (err) {
        console.error('❌ books.ts 로드 실패:', err);
        throw err;
    } finally {
        if (fs.existsSync(tempFilePath)) {
            // 디버깅을 위해 에러 시에는 파일 남겨둘 수도 있지만, 일단 삭제
            // fs.unlinkSync(tempFilePath); 
            // import된 파일은 unlink해도 캐시에 남아서 괜찮음.
            // 하지만 비동기 이슈 피해 나중에 삭제
        }
    }
}

// ------------------------------------------------------------------
// API & Download 함수들
// ------------------------------------------------------------------
async function fetchAladin(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    if (data.charCodeAt(0) === 0xFEFF) data = data.slice(1);
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    reject(new Error('API 응답 파싱 실패'));
                }
            });
        }).on('error', reject);
    });
}

async function searchBook(title, author) {
    if (!ALADIN_TTB_KEY) throw new Error('TTBKey 없음');
    const query = encodeURIComponent(title);
    const url = `https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?ttbkey=${ALADIN_TTB_KEY}&Query=${query}&QueryType=Title&MaxResults=5&start=1&SearchTarget=Book&Output=js&Version=20131101`;

    const result = await fetchAladin(url);
    if (!result.item || result.item.length === 0) return null;

    const matched = result.item.find(item => {
        const apiAuthor = item.author.replace(/\s/g, '');
        const localAuthor = author.replace(/\s/g, '').split(',')[0];
        return apiAuthor.includes(localAuthor);
    });
    return matched || result.item[0];
}

async function getBookDetail(itemId) {
    if (!ALADIN_TTB_KEY) throw new Error('TTBKey 없음');
    const url = `https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?ttbkey=${ALADIN_TTB_KEY}&itemIdType=ISBN13&ItemId=${itemId}&Output=js&Version=20131101&OptResult=packing,ratinginfo`;
    const result = await fetchAladin(url);
    return result.item ? result.item[0] : null;
}

async function downloadCover(url, filename) {
    const filepath = path.join(coversDir, filename);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Status ${res.statusCode}`));
                return;
            }
            res.pipe(file);
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

// ------------------------------------------------------------------
// Main
// ------------------------------------------------------------------
async function run() {
    if (!ALADIN_TTB_KEY) return;

    console.log('📚 books.ts 로드 중...');
    let books;
    try {
        books = await loadBooks();
    } catch (e) {
        return;
    }
    console.log(`총 ${books.length}권 로드됨.`);

    let updatedCount = 0;
    for (let i = 0; i < books.length; i++) {
        const book = books[i];
        console.log(`[${i + 1}/${books.length}] ${book.title}`);

        try {
            let searchResult = await searchBook(book.title, book.author);
            if (searchResult) {
                const detail = await getBookDetail(searchResult.itemId);
                if (detail) {
                    book.isbn = detail.isbn13 || detail.isbn;
                    book.pageCount = detail.subInfo?.itemPage || book.pageCount;
                    if (detail.subInfo?.packing) {
                        book.sizeWidth = detail.subInfo.packing.sizeWidth;
                        book.sizeHeight = detail.subInfo.packing.sizeHeight;
                        book.sizeDepth = detail.subInfo.packing.sizeDepth;
                        book.weight = detail.subInfo.packing.weight;
                    }
                    const coverUrl = detail.cover || searchResult.cover;
                    if (coverUrl) {
                        let highResUrl = coverUrl.replace('/coversum/', '/cover/'); // 화질 개선
                        const filename = `cover_${i}.jpg`;
                        const localPath = `/book_covers/${filename}`;
                        await downloadCover(highResUrl, filename);
                        book.coverImage = localPath;
                        book.thumbnailUrl = localPath;
                    }
                    updatedCount++;
                }
            } else {
                console.warn('   ⚠️ 검색 실패');
            }
        } catch (err) {
            console.error(`   ❌ 에러: ${err.message}`);
        }
        await new Promise(r => setTimeout(r, 400));
    }

    console.log(`\n💾 저장 중...`);

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

    const cleanedBooks = books.map(b => {
        const { spineColor, height, thickness, ...rest } = b;
        return rest;
    });

    const fileContent = `${interfaceDef}\n\nexport const books: Book[] = ${JSON.stringify(cleanedBooks, null, 2)};\n`;
    fs.writeFileSync(booksFilePath, fileContent, 'utf-8');

    // 임시 파일 정리
    const tempFilePath = path.join(__dirname, 'books_temp.js');
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

    console.log('✨ 완료.');
}

run();
