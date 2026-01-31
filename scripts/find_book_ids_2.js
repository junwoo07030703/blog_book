
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const booksFilePath = path.join(rootDir, 'src/data/books.ts');
// 재사용
const tempFilePath = path.join(__dirname, 'books_temp_ids_2.js');

async function findIds() {
    let content = fs.readFileSync(booksFilePath, 'utf-8');
    content = content.replace(/export\s+interface\s+Book\s*\{[\s\S]*?\n\}/g, '');
    content = content.replace(/:\s*Book\[\]/, '');
    fs.writeFileSync(tempFilePath, content);

    const { books } = await import(pathToFileURL(tempFilePath).href);

    const queries = ["홀", "말투"];

    queries.forEach(q => {
        const matched = books.filter(b => b.title.includes(q));
        if (matched.length > 0) {
            console.log(`\n🔎 Query: "${q}"`);
            matched.forEach(b => {
                console.log(`   - Title: "${b.title}" / ID: "${b.id}"`);
            });
        }
    });

    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
}

findIds();
