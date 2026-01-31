
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const booksFilePath = path.join(__dirname, '../src/data/books.ts');
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

// Fields to remove
const fieldsToRemove = ['description', 'height', 'thickness', 'spineColor'];

books.forEach(book => {
    fieldsToRemove.forEach(field => {
        delete book[field];
    });
});

// Update file
const newArrString = JSON.stringify(books, null, 2);
const newFileContent = fileContent.substring(0, startIndex) + newArrString + fileContent.substring(endIndex + 1);

fs.writeFileSync(booksFilePath, newFileContent, 'utf-8');
console.log(`Removed ${fieldsToRemove.join(', ')} from ${books.length} books.`);
