
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksPath = path.join(rootDir, 'src/data/books.ts');
const tempPath = path.join(__dirname, 'books_temp_debug.js');

async function debug() {
    let content = fs.readFileSync(booksPath, 'utf-8');
    // Remove TS interface and type annotation
    content = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');
    content = content.replace(/:\s*Book\[\]/, '');
    fs.writeFileSync(tempPath, content);

    const { books } = await import(pathToFileURL(tempPath).href);

    const targets = ["맡겨진 소녀", "이처럼 사소한 것들", "부분과 전체"]; // '부분과전체'가 title일 수도 있으니 유의

    console.log(`Total books: ${books.length}`);

    targets.forEach(t => {
        // 공백 무시하고 검색
        const book = books.find(b => b.title.replace(/\s/g, '').includes(t.replace(/\s/g, '')));
        if (book) {
            console.log(`\n📚 [${book.title}]`);
            console.log(`   - ID: ${book.id}`);
            console.log(`   - Author: "${book.author}"`);
            console.log(`   - Publisher: "${book.publisher}"`);
            console.log(`   - Cover: "${book.coverImage}"`);
        } else {
            console.log(`\n❌ [${t}]: Not Found in books.ts`);
        }
    });

    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
}

debug();
