import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../src/data/books_enriched.json');
const tsPath = path.join(__dirname, '../src/data/books.ts');
const coversDir = path.join(__dirname, '../public/book_covers');

// Function to recursively remove keys with null values
function removeNulls(obj) {
    if (obj === null) return undefined;
    if (typeof obj === 'object') {
        for (const key in obj) {
            if (obj[key] === null) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                removeNulls(obj[key]);
            }
        }
    }
    return obj;
}

try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    let books = JSON.parse(jsonContent);

    console.log(`Processing ${books.length} books...`);

    books = books.map((book, index) => {
        // 1. Local Image Mapping
        const coverFilename = `cover_${index}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            if (book.title === '마가복음서') {
                book.coverImage = '/book_covers/mark_gospel.png';
                book.thumbnailUrl = '/book_covers/mark_gospel.png';
            } else if (book.title === '인공지능과 인간') {
                book.coverImage = '/book_covers/ai_and_human.png';
                book.thumbnailUrl = '/book_covers/ai_and_human.png';
            }
        }

        // 2. Remove kdcClass and rating
        delete book.kdcClass;
        delete book.rating;

        // 3. Dimension Fix
        if (book.sizeWidth && book.sizeHeight) {
            if (book.sizeWidth > book.sizeHeight) {
                const temp = book.sizeWidth;
                book.sizeWidth = book.sizeHeight;
                book.sizeHeight = temp;
                console.log(`Swapped dimensions for: ${book.title}`);
            }
        }

        return book;
    });

    // Clean nulls
    books.forEach(b => removeNulls(b));

    // Re-export Book type
    const tsContent = `import { Book } from '../types/Book';
export type { Book } from '../types/Book';

export const books: Book[] = ${JSON.stringify(books, null, 2)};`;

    fs.writeFileSync(tsPath, tsContent, 'utf8');
    console.log(`Successfully reconstructed books.ts with ${books.length} items (nulls removed).`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
