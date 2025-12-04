import fs from "fs";
import path from "path";
import { marked } from "marked";

const POST_DIR = "posts";
const OUTPUT_DIR = "dist";
const TEMPLATE_DIR = "templates"; // 템플릿 경로 정의

// GitHub Pages용
const noJekyllSrc = ".nojekyll";
const noJekyllDest = path.join(OUTPUT_DIR, ".nojekyll");

// 카테고리 목록 가져오기
function getCategories() {
    if (!fs.existsSync(POST_DIR)) {
        console.warn(`⚠️  Posts directory not found: ${POST_DIR}`);
        return [];
    }
    return fs.readdirSync(POST_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.'));
}
const CATEGORIES = getCategories();

// 헬퍼 함수: 파일 읽기 (없으면 빈 문자열 반환)
function readFileSafe(filePath) {
    if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, "utf-8");
    }
    return "";
}

// 헬퍼 함수: 템플릿 로드 및 데이터 치환 (핵심 기능!)
function renderTemplate(templateName, data) {
    const templatePath = path.join(TEMPLATE_DIR, templateName);
    let html = readFileSafe(templatePath);
    
    if (!html) {
        console.error(`❌ Template not found: ${templateName}`);
        return "";
    }

    // data 객체의 키-값을 이용해 {{KEY}}를 Value로 치환
    for (const key in data) {
        // 정규표현식으로 {{KEY}}를 찾아 모두 바꿈
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, data[key]);
    }
    return html;
}

// CSS 경로 계산
function getCssPath(depth = 0) {
    if (depth === 0) return "trauma.css";
    return "../".repeat(depth) + "trauma.css";
}

// 헤더 생성 (기존 로직 유지하되 간소화)
function getHeaderHtml(depth = 0) {
    const cssPath = getCssPath(depth);
    const navLinksHtml = CATEGORIES.map(c => {
        const encodedPath = encodeURIComponent(c);
        return `<a href="/${encodedPath}/index.html">${c}</a>`;
    }).join('');

    // header.html을 읽어서 CSS 경로와 네비게이션을 주입
    // (templates/header.html 파일이 있어야 합니다. 없으면 아래 문자열 사용)
    let headerTemplate = readFileSafe(path.join(TEMPLATE_DIR, "header.html"));
    
    // header.html이 아직 없다면 기본값 사용 (나중에 파일로 분리 추천)
    if (!headerTemplate) {
        headerTemplate = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MathTrauma Blog</title>
    <link rel="stylesheet" href="{{CSS_PATH}}">
</head>
<body class="blog-shell">
<div class="site-frame">
    <nav class="top-nav">
        <div class="nav-inner">
            <a href="/" class="brand">MathTrauma</a>
            <div class="nav-links">
                {{NAV_LINKS}}
            </div>
        </div>
    </nav>
        `;
    }

    return headerTemplate
        .replace('{{CSS_PATH}}', cssPath)
        .replace('{{NAV_LINKS}}', navLinksHtml);
}

const FOOTER_HTML = readFileSafe(path.join(TEMPLATE_DIR, "footer.html")) || `
    <footer class="footer">
        <p>&copy; 2025 MathTrauma Blog. All rights reserved.</p>
    </footer>
</div>
</body>
</html>
`;

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

function extractTitle(content, isMarkdown = true) {
    if (isMarkdown) {
        const lines = content.split("\n");
        for (const line of lines) {
            const match = line.match(/^#\s+(.+)/);
            if (match) {
                return match[1].trim();
            }
        }
    } else {
        const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) return h1Match[1].replace(/<[^>]+>/g, '').trim();
        const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) return titleMatch[1].trim();
    }
    return "Untitled";
}

function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-");
}

function needsRebuild(srcPath, htmlPath) {
    if (!fs.existsSync(htmlPath)) return true;
    const srcTime = fs.statSync(srcPath).mtime;
    const htmlTime = fs.statSync(htmlPath).mtime;
    return srcTime > htmlTime;
}

marked.setOptions({ gfm: true, breaks: true });

function copyAssets() {
    const cssSrc = "trauma.css";
    const cssDest = path.join(OUTPUT_DIR, "trauma.css");
    if (fs.existsSync(cssSrc)) {
        if (!fs.existsSync(cssDest) || fs.statSync(cssSrc).mtime > fs.statSync(cssDest).mtime) {
            fs.copyFileSync(cssSrc, cssDest);
            console.log("Copied trauma.css");
        }
    }
    if (fs.existsSync(noJekyllSrc) && !fs.existsSync(noJekyllDest)) {
        fs.copyFileSync(noJekyllSrc, noJekyllDest);
    }
}

function renderCategory(categoryRaw, forceRebuild = false) {
    const categoryFolderName = categoryRaw;
    const srcFolder = path.join(POST_DIR, categoryFolderName);
    const outFolder = path.join(OUTPUT_DIR, categoryFolderName);
    ensureDir(outFolder);
    
    if (!fs.existsSync(srcFolder)) return;

    const files = fs.readdirSync(srcFolder).filter(f => 
        (f.endsWith(".md") || f.endsWith(".html")) && f !== "index.html"
    );
    
    const posts = [];

    // [1] 개별 포스트 렌더링
    for (const file of files) {
        const srcPath = path.join(srcFolder, file);
        const isMarkdown = file.endsWith(".md");
        const content = fs.readFileSync(srcPath, "utf-8");
        
        const title = extractTitle(content, isMarkdown);
        const slug = slugify(title);
        const outPath = path.join(outFolder, `${slug}.html`);

        if (!forceRebuild && !needsRebuild(srcPath, outPath)) {
            posts.push({ title, slug });
            continue;
        }

        let htmlBody = isMarkdown ? marked.parse(content) : content;
        
        // ★ 여기가 핵심 변경 포인트: 템플릿 사용
        const mainContent = renderTemplate("post_layout.html", {
            TITLE: escapeHtml(title),
            CONTENT_BODY: htmlBody,
            CATEGORY_NAME: categoryFolderName
        });

        // 헤더 + 본문 + 푸터 조립
        const fullHtml = getHeaderHtml(1) + mainContent + FOOTER_HTML;
        fs.writeFileSync(outPath, fullHtml, "utf-8");
        
        console.log(`✅ Rendered: ${slug}.html`);
        posts.push({ title, slug });
    }

    // [2] 카테고리 인덱스 페이지 렌더링
    let postListHtml = "";
    if (posts.length === 0) {
        postListHtml = `<div class="panel"><p>아직 게시물이 없습니다.</p></div>`;
    } else {
        postListHtml = posts.map(post => `
            <a href="${post.slug}.html" class="post-card">
                <div class="card-kicker">${categoryFolderName}</div>
                <h3>${escapeHtml(post.title)}</h3>
            </a>
        `).join('');
    }

    const allCategoriesLinks = CATEGORIES.map(c => 
        `<li><a href="/${encodeURIComponent(c)}/index.html">${c}</a></li>`
    ).join('');

    // ★ 템플릿 사용
    const indexContent = renderTemplate("category_index.html", {
        CATEGORY_NAME: categoryFolderName,
        POST_COUNT: posts.length,
        POST_LIST_HTML: postListHtml,
        ALL_CATEGORIES_LINKS: allCategoriesLinks
    });

    fs.writeFileSync(path.join(outFolder, "index.html"), getHeaderHtml(1) + indexContent + FOOTER_HTML, "utf-8");
}

function buildRootIndex() {
    ensureDir(OUTPUT_DIR);

    const categoryCardsHtml = CATEGORIES.map(c => `
        <a href="${encodeURIComponent(c)}/index.html" class="post-card">
            <div class="card-kicker">카테고리</div>
            <h3>${c}</h3>
            <p class="card-excerpt">포스트 보러가기 →</p>
        </a>
    `).join('');

    // ★ 템플릿 사용
    const rootContent = renderTemplate("root_index.html", {
        CATEGORY_CARDS: categoryCardsHtml
    });

    fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), getHeaderHtml(0) + rootContent + FOOTER_HTML, "utf-8");
}

function main() {
    const args = process.argv.slice(2);
    ensureDir(OUTPUT_DIR);
    copyAssets();
    const force = args[0] === '--force';

    console.log(force ? '🔄 Force Rebuild...' : '🚀 Incremental Build...');
    
    for (const category of CATEGORIES) {
        renderCategory(category, force);
    }
    //buildRootIndex();
}

main();