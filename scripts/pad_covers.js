
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
const coversDir = path.join(__dirname, '../public/book_covers');

// 1. Read books.ts
const fileContent = fs.readFileSync(booksFilePath, 'utf-8');

// Extract array
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

// 2. Identify files to rename
// Map: oldName -> newName
const renameMap = new Map();

// Helper to pad
const pad = (num) => String(num).padStart(3, '0');

books.forEach(book => {
    const formatMatch = book.coverImage.match(/\/book_covers\/cover_(\d+)\.jpg/);
    if (formatMatch) {
        const num = parseInt(formatMatch[1], 10);
        const oldName = `cover_${num}.jpg`;
        const newName = `cover_${pad(num)}.jpg`;

        if (oldName !== newName) {
            renameMap.set(oldName, newName);

            // Update book object
            book.coverImage = `/book_covers/${newName}`;
            book.thumbnailUrl = `/book_covers/${newName}`;
        }
    }
});

// 3. Rename files on disk
console.log(`Found ${renameMap.size} files to rename.`);

// Create a check to avoid overwriting existing files immediately if conflicts exist
// But we are just padding, so cover_1 -> cover_001. cover_100 -> cover_100 (no change).
// Conflicts could happen if cover_001 ALREADY existed. 
// Step 22 showed no padded files (only cover_1, cover_10, etc).
// So it should be safe.

const existingFiles = fs.readdirSync(coversDir);
const filesSet = new Set(existingFiles);

let renameCount = 0;
for (const [oldName, newName] of renameMap) {
    if (filesSet.has(oldName)) {
        if (filesSet.has(newName)) {
            // newName already exists? checking if it's the same file is tricky without processing first.
            // But since our source is cover_N and target is cover_00N,
            // cover_1 exists, cover_001 does not.
            // cover_100 exists, target is cover_100 -> oldName === newName, so wouldn't be in map.
            // So collision is unlikely unless duplicate numbering existed.
        }

        const oldPath = path.join(coversDir, oldName);
        const newPath = path.join(coversDir, newName);

        try {
            fs.renameSync(oldPath, newPath);
            renameCount++;
        } catch (err) {
            console.error(`Error renaming ${oldName} to ${newName}:`, err);
        }
    } else {
        // console.warn(`File not found: ${oldName}`);
    }
}

console.log(`Renamed ${renameCount} files on disk.`);

// 4. Update books.ts
const newArrString = JSON.stringify(books, null, 2);
const newFileContent = fileContent.substring(0, startIndex) + newArrString + fileContent.substring(endIndex + 1);

fs.writeFileSync(booksFilePath, newFileContent, 'utf-8');
console.log('Updated books.ts references.');
