
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
const coversDir = path.join(__dirname, '../public/book_covers');
const tempDir = path.join(__dirname, '../public/book_covers_temp');

// Helper to pad
const pad = (num) => String(num).padStart(3, '0');

// 1. Read books.ts
const fileContent = fs.readFileSync(booksFilePath, 'utf-8');
const startIndex = fileContent.indexOf('[');
const endIndex = fileContent.lastIndexOf(']');
const arrString = fileContent.substring(startIndex, endIndex + 1);

let books;
try {
    const parseFn = new Function('return ' + arrString);
    books = parseFn();
} catch (e) {
    console.error('Failed to parse books:', e);
    process.exit(1);
}

// 2. Prepare Temp Directory
if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(tempDir);

// 3. Process Books
console.log(`Processing ${books.length} books...`);

books.forEach((book, index) => {
    // Determine current file path
    // book.coverImage is like "/book_covers/montage.png" or "/book_covers/cover_005.jpg"
    const currentFileName = path.basename(book.coverImage);
    const sourcePath = path.join(coversDir, currentFileName);

    // Determine new file name
    const newFileName = `cover_${pad(index)}.jpg`;
    const destPath = path.join(tempDir, newFileName);

    // Copy file
    if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);

        // Update book data
        book.coverImage = `/book_covers/${newFileName}`;
        book.thumbnailUrl = `/book_covers/${newFileName}`;
    } else {
        console.error(`Source file missing for book "${book.title}": ${sourcePath}`);
    }
});

// 4. Update books.ts
const newArrString = JSON.stringify(books, null, 2);
const newFileContent = fileContent.substring(0, startIndex) + newArrString + fileContent.substring(endIndex + 1);
fs.writeFileSync(booksFilePath, newFileContent, 'utf-8');

console.log('books.ts updated.');

// 5. Swap Directories
// We can't easily "swap" in node without risk. 
// Safest: Delete contents of coversDir, then copy from tempDir, then remove tempDir.
// OR: Rename coversDir to backup, rename tempDir to coversDir.

const backupDir = path.join(__dirname, '../public/book_covers_backup');
if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
}

fs.renameSync(coversDir, backupDir);
fs.renameSync(tempDir, coversDir);

console.log('Book covers directory updated. Backup saved to public/book_covers_backup.');
console.log(`Renamed total ${books.length} files.`);
