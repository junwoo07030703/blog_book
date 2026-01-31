import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.join(__dirname, '../src/data/books_enriched.json');
const tsPath = path.join(__dirname, '../src/data/books.ts');
const coversDir = path.join(__dirname, '../public/book_covers');

try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    let books = JSON.parse(jsonContent);

    console.log(`Processing ${books.length} books...`);

    books = books.map((book, index) => {
        // 1. Local Image Mapping
        // Check if cover file exists for this index
        // Note: Filenames are like cover_0.jpg, cover_1.jpg...
        // We rely on the index in the json array matching the file suffix.
        const coverFilename = `cover_${index}.jpg`;
        const coverPath = path.join(coversDir, coverFilename);

        if (fs.existsSync(coverPath)) {
            book.coverImage = `/book_covers/${coverFilename}`;
            book.thumbnailUrl = `/book_covers/${coverFilename}`;
        } else {
            // Fallback for special cases if existing in enriched json, or keep remote
            // But user strongly implies local images.
            // Some books might have custom names like 'ai_and_human.png', 'mark_gospel.png'
            // We can check if the book has a specific ID or title to map specially if needed,
            // but lacking that map, we stick to the index or existing field if it looks local.

            // Check if it's already local in json (unlikely given previous view)
            if (book.coverImage && !book.coverImage.startsWith('http')) {
                // already local
            } else {
                // Try to see if there's a map? 
                // Actually, looking at the file list, there are only specific named ones:
                if (book.title === '마가복음서') {
                    book.coverImage = '/book_covers/mark_gospel.png';
                    book.thumbnailUrl = '/book_covers/mark_gospel.png';
                } else if (book.title === '인공지능과 인간') {
                    book.coverImage = '/book_covers/ai_and_human.png';
                    book.thumbnailUrl = '/book_covers/ai_and_human.png';
                }
                // Otherwise leave as is (remote) if cover_N doesn't exist?
            }
        }

        // 2. Field Cleanup
        delete book.spineColor;
        delete book.height;
        delete book.thickness;
        delete book.link; // User didn't explicitly ask, but typical for polish
        // Also remove kdcClass and rating if present (already removed from interface, but good to clean data)
        delete book.kdcClass;
        delete book.rating;

        // 3. Dimension Fix
        // Ensure width is smaller than height (portrait mode), unless it's a known landscape book?
        // User requested: "books.ts에 있는 sizeHeight가 sizeWidth보다 작은 항목들 찾아서 두개의 값을 바꿔줘"
        // This implies standard logic is Height > Width.
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

    const tsContent = `import { Book } from '../types/Book';

export const books: Book[] = ${JSON.stringify(books, null, 2)};`;

    fs.writeFileSync(tsPath, tsContent, 'utf8');
    console.log(`Successfully reconstructed books.ts with ${books.length} items from books_enriched.json.`);

} catch (error) {
    console.error('Error during reconstruction:', error);
}
