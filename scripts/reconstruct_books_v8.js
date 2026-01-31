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

    // Counter for "normal" books (excluding '몽타주')
    let normalBookIndex = 0;

    books = books.map((book, index) => {
        // 1. Check for Specific Exception: "몽타주"
        if (book.title.includes("몽타주")) {
            book.coverImage = '/book_covers/montage.png';
            book.thumbnailUrl = '/book_covers/montage.png';
            // Do NOT increment normalBookIndex
            return book;
        }

        // 2. Normal Mapping Logic
        // We have 111 total - 1 special = 110 normal books.
        // We have covers 0 to 107 (108 covers).
        // Difference = 2.
        // So we need 3 books to share cover_0 to absorb the diff.
        // (0, 0, 0) -> takes indices 0, 1, 2.
        // Index 3 -> cover_1.
        // Index 109 -> cover_107.

        let targetCoverIndex;
        if (normalBookIndex < 3) {
            targetCoverIndex = 0;
        } else {
            // normalBookIndex 3 -> 1
            // normalBookIndex 4 -> 2
            targetCoverIndex = normalBookIndex - 2;
        }

        // Safety clamp just in case logic is slightly off
        targetCoverIndex = Math.min(targetCoverIndex, 107);

        const coverFilename = `cover_${targetCoverIndex}.jpg`;

        book.coverImage = `/book_covers/${coverFilename}`;
        book.thumbnailUrl = `/book_covers/${coverFilename}`;

        // Prepare for next
        normalBookIndex++;

        // Cleanup
        delete book.kdcClass;
        delete book.rating;

        // Dimensions
        if (book.sizeWidth && book.sizeHeight) {
            if (book.sizeWidth > book.sizeHeight) {
                const temp = book.sizeWidth;
                book.sizeWidth = book.sizeHeight;
                book.sizeHeight = temp;
            }
        }

        return book;
    });

    // Clean nulls
    books.forEach(b => removeNulls(b));

    const tsContent = `import type { Book } from '../types/Book';
export type { Book } from '../types/Book';

export const books: Book[] = ${JSON.stringify(books, null, 2)};`;

    fs.writeFileSync(tsPath, tsContent, 'utf8');
    console.log(`Successfully reconstructed books.ts v8.`);
    console.log(`Total "normal" books processed: ${normalBookIndex}`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
