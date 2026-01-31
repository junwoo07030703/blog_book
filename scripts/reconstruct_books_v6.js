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

    // Total available covers: 108 (0 to 107)
    const MAX_COVER_INDEX = 107;

    books = books.map((book, index) => {
        // User Logic:
        // "Start from cover_0" -> 0 maps to 0
        // "Make the last 3 use cover_107" -> 108, 109, 110 map to 107
        // Implies: Clamp index to MAX_COVER_INDEX

        const targetCoverIndex = Math.min(index, MAX_COVER_INDEX);

        const coverFilename = `cover_${targetCoverIndex}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            // Should not happen with this logic if files 0-107 exist, 
            // but safe fallback just in case.
            console.warn(`Cover file not found for book [${index}] mapped to ${coverFilename}. Using cover_0.jpg`);
            book.coverImage = '/book_covers/cover_0.jpg';
            book.thumbnailUrl = '/book_covers/cover_0.jpg';
        }

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
    console.log(`Successfully reconstructed books.ts with ${books.length} items using Clamped (0-107) mapping.`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
