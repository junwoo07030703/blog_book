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
        let targetCoverIndex;

        // User Logic:
        // "Make the last book use cover_107"
        // "Fill securely in order"
        // "First three books use cover_0"

        // Math:
        // Index 0 -> cover_0
        // Index 1 -> cover_0
        // Index 2 -> cover_0
        // Index 3 -> cover_0
        // ...
        // Index 110 -> cover_107

        // Formula:
        // If index < 3, use 0.
        // If index >= 3, use index - 3.

        if (index < 3) {
            targetCoverIndex = 0;
        } else {
            targetCoverIndex = index - 3;
        }

        const coverFilename = `cover_${targetCoverIndex}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        // Check existence just in case, but rely on the logic primarily
        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            // Fallback for special named files if they exist in the dir but not by index scheme
            // or just use cover_0 as ultimate safety.
            console.warn(`Cover file not found for book [${index}]: ${coverFilename}. Using cover_0.jpg`);
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
    console.log(`Successfully reconstructed books.ts with ${books.length} items using shifted cover mapping.`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
