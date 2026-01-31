
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
const fileContent = fs.readFileSync(booksFilePath, 'utf-8');

// Extract the array part
const startIndex = fileContent.indexOf('[');
const endIndex = fileContent.lastIndexOf(']');

if (startIndex === -1 || endIndex === -1) {
    console.error('Could not find books array in books.ts');
    process.exit(1);
}

const arrString = fileContent.substring(startIndex, endIndex + 1);
let books;
try {
    // Use Function constructor to parse valid JS object literal (handles comments, trailing commas, etc.)
    // We wrap in parentheses to ensure it's treated as an expression
    const parseFn = new Function('return ' + arrString);
    books = parseFn();
} catch (e) {
    console.error('Failed to parse book data as JS:', e);
    console.log('Snippet causing error:', arrString.substring(0, 100) + '...');
    process.exit(1);
}

const specialCovers = {
    '몽타주': '/book_covers/montage.png',
    '마가복음서': '/book_covers/mark_gospel.png',
    '인공지능과 인간': '/book_covers/ai_and_human.png'
};

let coverIndex = 0;
const maxCoverIndex = 107; // cover_0 to cover_107

books.forEach(book => {
    if (specialCovers[book.title]) {
        console.log(`Assigning special cover to: ${book.title}`);
        book.coverImage = specialCovers[book.title];
        book.thumbnailUrl = specialCovers[book.title];
    } else {
        // Determine cover file
        let indexToUse = coverIndex;
        if (indexToUse > maxCoverIndex) {
            // Recycle just in case
            indexToUse = indexToUse % (maxCoverIndex + 1);
        }

        const coverName = `cover_${indexToUse}.jpg`;
        book.coverImage = `/book_covers/${coverName}`;
        book.thumbnailUrl = `/book_covers/${coverName}`;

        coverIndex++;
    }
});

// Convert back to string
// JSON.stringify will produce standard JSON. 
// The original file had keys quoted, so this matches.
const newArrString = JSON.stringify(books, null, 2);

const newFileContent = fileContent.substring(0, startIndex) + newArrString + fileContent.substring(endIndex + 1);

fs.writeFileSync(booksFilePath, newFileContent, 'utf-8');
console.log(`Successfully updated ${books.length} books.`);
console.log(`Assigned sequential covers up to cover_${coverIndex - 1}.jpg`);
