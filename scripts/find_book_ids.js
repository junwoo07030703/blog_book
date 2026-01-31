
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
const tempFilePath = path.join(__dirname, 'books_temp_ids.js');

async function findIds() {
    let content = fs.readFileSync(booksFilePath, 'utf-8');
    content = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');
    content = content.replace(/:\s*Book\[\]/, '');
    fs.writeFileSync(tempFilePath, content);

    const { books } = await import(pathToFileURL(tempFilePath).href);

    // 검색어 (일부 매칭)
    const queries = ["숨", "카오스", "홀", "모든 관계는 말투에서 시작된다"];

    console.log(`Total books: ${books.length}`);

    queries.forEach(q => {
        // 정확도를 위해 filter 사용
        const matched = books.filter(b => b.title.replace(/\s/g, '').includes(q.replace(/\s/g, '')));

        if (matched.length > 0) {
            console.log(`\n🔎 Query: "${q}"`);
            matched.forEach(b => {
                console.log(`   - [${b.title}] / Author: ${b.author} / ID: "${b.id}" / Cover: ${b.coverImage}`);
            });
        } else {
            console.log(`\n❌ Query: "${q}" - Not Found`);
        }
    });

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
}

findIds();
