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
        const coverFilename = `cover_${index}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        // STRICT LOCAL POLICY:
        // Use local file if exists.
        // If NOT exists, use a safe fallback (cover_0.jpg) to prevent CORS crash.
        // Do NOT leave remote URLs.

        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            // Check special cases
            if (book.title === '마가복음서') {
                book.coverImage = '/book_covers/mark_gospel.png';
                book.thumbnailUrl = '/book_covers/mark_gospel.png';
            } else if (book.title === '인공지능과 인간') {
                book.coverImage = '/book_covers/ai_and_human.png';
                book.thumbnailUrl = '/book_covers/ai_and_human.png';
            } else {
                // Fallback to random existing cover or generic
                // Let's use cover_0.jpg as a safe fallback
                console.warn(`Missing local cover for [${index}] ${book.title}. Using fallback.`);
                book.coverImage = '/book_covers/cover_0.jpg';
                book.thumbnailUrl = '/book_covers/cover_0.jpg';
            }
        }

        delete book.kdcClass;
        delete book.rating;

        if (book.sizeWidth && book.sizeHeight) {
            if (book.sizeWidth > book.sizeHeight) {
                const temp = book.sizeWidth;
                book.sizeWidth = book.sizeHeight;
                book.sizeHeight = temp;
            }
        }

        return book;
    });

    books.forEach(b => removeNulls(b));

    const tsContent = `import type { Book } from '../types/Book';
export type { Book } from '../types/Book';

export const books: Book[] = ${JSON.stringify(books, null, 2)};`;

    fs.writeFileSync(tsPath, tsContent, 'utf8');
    console.log(`Successfully reconstructed books.ts with ${books.length} items (Safe Fallbacks).`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
