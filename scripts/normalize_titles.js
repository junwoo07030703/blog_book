import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const booksPath = path.join(__dirname, '../src/data/books.ts');

const targetTitles = [
    "물리학자는 두뇌를 믿지 않는다",
    "나의 무한한 혁명에게",
    "문득 사람이 그리운 날엔 시를 읽는다",
    "내가 행복한 이유",
    "여보, 나 좀 도와줘",
    "홀",
    "카오스",
    "일기에도 거짓말을 쓰는 사람",
    "미래의 손",
    "미래과거시제",
    "예술하는 습관",
    "돌연한 출발",
    "돈 공부는 처음이라",
    "쿼런틴",
    "여행의 이유",
    "누구나 시 하나쯤 가슴에 품고 산다",
    "양자역학 이야기",
    "김상욱의 양자 공부",
    "천문학자는 별을 보지 않는다",
    "영화 글쓰기 강의",
    "미적분의 쓸모",
    "대한민국 군대를 말한다",
    "맡겨진 소녀",
    "이처럼 사소한 것들",
    "부분과 전체",
    "내게 무해한 사람",
    "고양이 사진 좀 부탁해요",
    "참을 수 없는 존재의 가벼움",
    "종이 동물원",
    "당신 인생의 이야기",
    "숨",
    // "시련은 있어도 실패는 없다", // User said this one is NOT in books.ts, so existing logic would fail to find it anyway. Keep it here to see if maybe it IS there.
    "시련은 있어도 실패는 없다",
    "슈독 : 나이키 창업자 필 나이트 자서전",
    "물고기는 존재하지 않는다"
];

// Helper to sanitize for fuzzy comparison
function normalize(str) {
    return str.replace(/\s+/g, '').replace(/[.,:;'"\-]/g, '').toLowerCase();
}

let content = fs.readFileSync(booksPath, 'utf8');
let updatedCount = 0;

targetTitles.forEach(target => {
    const targetNorm = normalize(target);

    // Find a book in content whose title normalizes to the same string
    // This is a bit tricky with regex on the whole file. 
    // We'll iterate line by line to be safe or use a regex that captures titles.

    // Regex to find "title": "CURRENT_TITLE"
    const titleRegex = /"title":\s*"([^"]+)"/g;
    let match;
    let found = false;

    // We need to loop through all matches in the file content
    // We can't easily query the "object" without parsing.
    // But since we want to REPLACE in place, let's keep it simply string based.

    // Let's split content by lines for easier processing? 
    // No, multiline file. regex exec loop is fine.

    let tempContent = content; // Work on a copy/original doesn't matter for the search logic if we do one pass?
    // Actually, simple replace approach:

    // 1. Scan ALL titles first.
    // 2. Map normalized -> actual in file

    const fileTitles = [];
    while ((match = titleRegex.exec(content)) !== null) {
        fileTitles.push(match[1]);
    }

    // Find the matching current title
    const currentTitle = fileTitles.find(t => normalize(t) === targetNorm);

    if (currentTitle) {
        if (currentTitle === target) {
            console.log(`[OK] Already correct: "${target}"`);
        } else {
            console.log(`[UPDATE] "${currentTitle}" -> "${target}"`);
            // Replace globally (assuming titles are unique enough or we replace one instance)
            // Use exact string replacement
            // Escape quotes in title just in case
            const entryRegex = new RegExp(`"title":\\s*"${escapeRegExp(currentTitle)}"`);
            content = content.replace(entryRegex, `"title": "${target}"`);
            updatedCount++;
        }
    } else {
        console.log(`[MISSING] Could not find match for: "${target}" in books.ts`);
    }
});

if (updatedCount > 0) {
    fs.writeFileSync(booksPath, content, 'utf8');
    console.log(`\nSuccess! Updated ${updatedCount} titles.`);
} else {
    console.log('\nNo updates made.');
}

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
