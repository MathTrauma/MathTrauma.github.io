import fs from "fs";
import path from "path";
import { marked } from "marked";

const POST_DIR = "posts";
const OUTPUT_DIR = "dist";

// GitHub Pages 빌드를 위한 .nojekyll 파일 경로
const noJekyllSrc = ".nojekyll";
const noJekyllDest = path.join(OUTPUT_DIR, ".nojekyll");

const CATEGORIES = ["unity", "Problems%20And%20Solutions", "algorithm", "analysis", "complex", "geometry"];
const TEMPLATE_HEADER = fs.existsSync("templates/header.html") ? fs.readFileSync("templates/header.html", "utf-8") : "<html><body>"; // 파일 유무 체크 추가
const TEMPLATE_FOOTER = fs.existsSync("templates/footer.html") ? fs.readFileSync("templates/footer.html", "utf-8") : "</body></html>";

function ensureDir(dir) {
    if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
}

function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function extractTitle(markdown) {
    const lines = markdown.split("\n");
    for (const line of lines) {
        // # 뒤에 텍스트가 있는 경우 추출
        const match = line.match(/^#\s+(.+)/);
        if (match) {
            return match[1].trim();
        }
    }
    return "Untitled";
}

function slugify(text) {
    // 한글 제목도 안전하게 파일명으로 쓰기 위해 영문/숫자 외에는 제거하거나 인코딩 필요
    // 여기서는 간단하게 공백만 대시로 바꾸고 소문자화 (한글은 그대로 유지됨)
    return text.toLowerCase().trim().replace(/\s+/g, "-");
}

// 파일 수정 시간 비교 함수
function needsRebuild(mdPath, htmlPath) {
    if (!fs.existsSync(htmlPath)) return true;
    
    const mdTime = fs.statSync(mdPath).mtime;
    const htmlTime = fs.statSync(htmlPath).mtime;
    
    return mdTime > htmlTime;
}

// ★ marked 설정
marked.setOptions({
    gfm: true,
    breaks: true,
    // langPrefix는 최신 버전에서 동작 방식이 다를 수 있으나 유지
});

function copyAssets() {
    const cssSrc = "trauma.css";
    const cssDest = path.join(OUTPUT_DIR, "trauma.css");

    if (fs.existsSync(cssSrc)) {
        // CSS가 변경되었거나 타겟 파일이 없으면 복사
        if (!fs.existsSync(cssDest) || 
            fs.statSync(cssSrc).mtime > fs.statSync(cssDest).mtime) {
            fs.copyFileSync(cssSrc, cssDest);
            console.log("Copied trauma.css to dist/");
        }
    } else {
        console.warn("trauma.css not found in project root.");
    }

    if (fs.existsSync(noJekyllSrc)) {
        if (!fs.existsSync(noJekyllDest)) {
            fs.copyFileSync(noJekyllSrc, noJekyllDest);
            console.log("Copied .nojekyll to dist/");
        }
    }
}

function renderCategory(categoryRaw, forceRebuild = false) {
    // [수정됨] URL 인코딩된 카테고리명(%20)을 실제 폴더명(공백)으로 변환
    const categoryFolderName = decodeURIComponent(categoryRaw);
    
    const srcFolder = path.join(POST_DIR, categoryFolderName);
    // 출력 폴더는 URL 구조를 위해 인코딩된 이름 그대로 사용해도 되고, 디코딩된 이름을 써도 됨.
    // 웹 표준을 위해 폴더명은 공백이 없는 것이 좋으므로 raw(encoded) 값을 사용하거나 slugify 추천.
    // 여기서는 기존 로직 유지를 위해 categoryRaw 사용
    const outFolder = path.join(OUTPUT_DIR, categoryRaw);

    ensureDir(outFolder);
    
    if (!fs.existsSync(srcFolder)) {
        console.warn(`⚠️  Source folder not found: ${srcFolder}`);
        return;
    }

    const files = fs.readdirSync(srcFolder).filter(f => f.endsWith(".md"));
    const posts = [];
    let rebuiltCount = 0;

    for (const file of files) {
        const mdPath = path.join(srcFolder, file);

        let markdown = "";
        try {
            markdown = fs.readFileSync(mdPath, "utf-8");
        } catch (err) {
            console.error(`Failed to process ${file}:`, err.message);
            continue;
        }

        const title = extractTitle(markdown);
        
        // [수정됨] Date.now() 제거 -> 파일명 고정
        // 한글 제목 파일명 문제를 피하려면 encodeURIComponent 사용
        const slug = slugify(title); 
        
        // 파일명이 겹칠 경우를 대비해 원본 파일명도 활용 가능하지만, 일단 제목 기반으로 생성
        const outPath = path.join(outFolder, `${slug}.html`);

        // 증분 빌드 체크
        if (!forceRebuild && !needsRebuild(mdPath, outPath)) {
            // console.log(`⏭️  Skipping ${file}`); // 로그 너무 많으면 주석 처리
            posts.push({ title, slug });
            continue;
        }

        // [수정됨] marked() -> marked.parse() 로 변경 (최신 버전 호환)
        let htmlBody = "";
        try {
             htmlBody = marked.parse(markdown);
        } catch (e) {
             // 구버전 marked일 경우 fallback
             htmlBody = marked(markdown);
        }

        const output = `
${TEMPLATE_HEADER}
<main class="blog-container">
<article class="blog-post">
<h1>${escapeHtml(title)}</h1>
${htmlBody}
</article>
</main>
${TEMPLATE_FOOTER}
`;

        fs.writeFileSync(outPath, output, "utf-8");
        rebuiltCount++;
        console.log(`✅ Rendered: ${categoryFolderName}/${file} -> ${slug}.html`);

        posts.push({ title, slug });
    }

    if (rebuiltCount > 0) {
        console.log(`📁 ${categoryFolderName}: ${rebuiltCount} files rebuilt`);
    }

    // category index
    let indexHtml = `
${TEMPLATE_HEADER}
<main class="blog-container">
<h1>${categoryFolderName.toUpperCase()}</h1>
<ul>
`;

    if (posts.length === 0) {
        indexHtml += `<li>게시물이 없습니다.</li>`;
    } else {
        for (const post of posts) {
            indexHtml += `<li><a href="${post.slug}.html">${post.title}</a></li>`;
        }
    }

    indexHtml += `
</ul>
</main>
${TEMPLATE_FOOTER}
`;

    fs.writeFileSync(path.join(outFolder, "index.html"), indexHtml, "utf-8");
}

// ... (renderSingleFile 등 나머지 함수는 동일하지만 renderCategory 호출 로직에 주의) ...

function buildRootIndex() {
    ensureDir(OUTPUT_DIR);

    const html = `
${TEMPLATE_HEADER}
<main class="blog-container">
<h1>MathTrauma Blog</h1>
<ul>
${CATEGORIES.map(c => `<li><a href="${c}/index.html">${decodeURIComponent(c)}</a></li>`).join("")}
</ul>
</main>
${TEMPLATE_FOOTER}
`;

    fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), html, "utf-8");
}

function main() {
    const args = process.argv.slice(2);
    
    ensureDir(OUTPUT_DIR);
    copyAssets();

    if (args[0] === '--force') {
        console.log('🔄 Force rebuilding all files...');
        for (const category of CATEGORIES) {
            renderCategory(category, true);
        }
        buildRootIndex();
    } else {
        console.log('🚀 Starting incremental build...');
        for (const category of CATEGORIES) {
            renderCategory(category, false); // 기본 증분 빌드
        }
        buildRootIndex();
    }
}

main();