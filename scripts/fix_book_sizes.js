
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
const tempFilePath = path.join(__dirname, 'books_temp_fix.js');

async function fixBookSizes() {
    console.log('📚 books.ts 읽는 중...');

    // 1. books.ts -> books_temp_fix.js 변환 (Import 가능하도록)
    let content;
    try {
        content = fs.readFileSync(booksFilePath, 'utf-8');
    } catch (err) {
        console.error('파일 읽기 실패:', err);
        return;
    }

    // interface 제거 및 export const 수정
    let jsContent = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');
    jsContent = jsContent.replace(/:\s*Book\[\]/, '');

    fs.writeFileSync(tempFilePath, jsContent);

    // 2. 데이터 로드
    console.log('데이터 로드 중...');
    let books;
    try {
        const module = await import(pathToFileURL(tempFilePath).href);
        books = module.books;
    } catch (err) {
        console.error('데이터 파싱 실패:', err);
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        return;
    }

    // 3. 데이터 수정 (Width > Height 인 경우 Swap)
    let fixedCount = 0;
    const fixedTitles = [];

    books.forEach(book => {
        // 데이터가 숫자가 아닐 경우를 대비해 Number() 변환 (보통 숫자임)
        let w = Number(book.sizeWidth);
        let h = Number(book.sizeHeight);

        // 유효한 숫자인지 확인
        if (!isNaN(w) && !isNaN(h)) {
            // 가로가 세로보다 크면 교체 (일반적인 책은 세로가 긺)
            if (w > h) {
                // 스왑
                book.sizeWidth = h;
                book.sizeHeight = w;

                fixedCount++;
                fixedTitles.push(book.title);
                console.log(`   🔄 크기 보정: "${book.title}" (${w}x${h} -> ${h}x${w})`);
            }
        }
    });

    if (fixedCount === 0) {
        console.log('✨ 수정할 항목이 없습니다. 모든 책이 세로가 더 깁니다.');
    } else {
        console.log(`\n총 ${fixedCount}권의 책 크기를 보정했습니다.`);

        // 4. 저장
        console.log('💾 books.ts 저장 중...');

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

        // 필드 순서 정리는 선택사항이지만 깔끔하게 유지
        // 여기선 그냥 JSON.stringify
        const fileContent = `${interfaceDef}\n\nexport const books: Book[] = ${JSON.stringify(books, null, 2)};\n`;

        fs.writeFileSync(booksFilePath, fileContent, 'utf-8');
        console.log('✨ 저장 완료.');
    }

    // 5. 뒷정리
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
}

fixBookSizes();
