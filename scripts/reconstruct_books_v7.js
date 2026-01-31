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

    // 1. Apply Base Mapping Logic (Shifted/Clamped as per previous success)
    // "First 3 (0-2) -> cover_0"
    // "Next 3+ -> shifted (index-3 until max 107)"
    // "Last ones -> clamped to 107"

    const MAX_COVER_INDEX = 107;

    books = books.map((book, index) => {
        let targetCoverIndex;

        // Re-applying the logic user said "Yes" to (Shifted):
        // "다시 첫 3권(1~3번 책) ➡️ 모두 cover_0.jpg 사용"
        // "4번째 책(Index 3) ~ ... ➡️ cover_0 ~ ... 하나씩 밀려서 매핑"

        if (index < 3) {
            targetCoverIndex = 0;
        } else {
            // For Index 3, we want cover_0.
            // For Index 4, we want cover_1.
            // So: index - 3
            // BUT we must clamp to 107 for the very last items.
            targetCoverIndex = Math.min(index - 3, MAX_COVER_INDEX);
        }

        const coverFilename = `cover_${targetCoverIndex}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            // Safe fallback
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

    // 2. Apply Specific Overrides (Left Neighbor Logic)
    // "시여, 침을 뱉어라" -> Left Neighbor gets montage.png
    // "운명이다" -> Left Neighbor gets ai_and_human.png

    const title1 = "시여, 침을 뱉어라";
    const title2 = "운명이다";

    const index1 = books.findIndex(b => b.title === title1);
    if (index1 > 0) {
        console.log(`Found '${title1}' at index ${index1}. Updating index ${index1 - 1}.`);
        books[index1 - 1].coverImage = '/book_covers/montage.png';
        books[index1 - 1].thumbnailUrl = '/book_covers/montage.png';
    } else {
        console.warn(`Could not find '${title1}' or it is at index 0.`);
    }

    const index2 = books.findIndex(b => b.title === title2);
    if (index2 > 0) {
        console.log(`Found '${title2}' at index ${index2}. Updating index ${index2 - 1}.`);
        books[index2 - 1].coverImage = '/book_covers/ai_and_human.png';
        books[index2 - 1].thumbnailUrl = '/book_covers/ai_and_human.png';
    } else {
        console.warn(`Could not find '${title2}' or it is at index 0.`);
    }

    // Clean nulls
    books.forEach(b => removeNulls(b));

    const tsContent = `import type { Book } from '../types/Book';
export type { Book } from '../types/Book';

export const books: Book[] = ${JSON.stringify(books, null, 2)};`;

    fs.writeFileSync(tsPath, tsContent, 'utf8');
    console.log(`Successfully reconstructed books.ts with 111 items (Base logic + Specific Overrides).`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
