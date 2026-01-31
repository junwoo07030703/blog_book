const fs = require('fs');
const path = require('path');

const booksPath = path.join(__dirname, '../src/data/books.ts');
let content = fs.readFileSync(booksPath, 'utf8');

if (!content.includes('rating?: number;')) {
    content = content.replace('tags: string[];', 'tags: string[];\n  rating?: number;');
    fs.writeFileSync(booksPath, content, 'utf8');
    console.log('Added rating field to Book interface');
} else {
    console.log('Rating field already exists');
}
