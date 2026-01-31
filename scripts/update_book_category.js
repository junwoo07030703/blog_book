const fs = require('fs');
const path = require('path');

const booksPath = path.join(__dirname, '../src/data/books.ts');
const content = fs.readFileSync(booksPath, 'utf8');

// Replace standard "category": "자기계발"
// We use a regex to ensure we don't accidentally replace something in contentHtml if possible, 
// though "category": "자기계발" is specific enough for the JSON structure.
const newContent = content.replace(/"category": "자기계발"/g, '"category": "기타"');

if (content !== newContent) {
    fs.writeFileSync(booksPath, newContent, 'utf8');
    console.log('Successfully updated category from "자기계발" to "기타"');
} else {
    console.log('No "자기계발" category found to update.');
}
