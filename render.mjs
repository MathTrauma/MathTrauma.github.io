import fs from "fs";
import path from "path";
import { marked } from "marked";

const POST_DIR = "posts";
const OUTPUT_DIR = "dist";

// GitHub Pages 빌드를 위한 .nojekyll 파일 경로
const noJekyllSrc = ".nojekyll";
const noJekyllDest = path.join(OUTPUT_DIR, ".nojekyll");

// posts 폴더에서 동적으로 카테고리 목록 생성
function getCategories() {
    if (!fs.existsSync(POST_DIR)) {
        console.warn(`⚠️  Posts directory not found: ${POST_DIR}`);
        return [];
    }
    
    return fs.readdirSync(POST_DIR, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name)
        .filter(name => !name.startsWith('.')); // 숨김 폴더 제외
}

const CATEGORIES = getCategories();
console.log(`📂 발견된 카테고리 (${CATEGORIES.length}개):`, CATEGORIES);
// 페이지 깊이에 따라 CSS 경로를 반환하는 함수
function getCssPath(depth = 0) {
    if (depth === 0) return "trauma.css";
    return "../".repeat(depth) + "trauma.css";
}

// 템플릿 헤더 생성 함수
function getTemplateHeader(depth = 0) {
    const cssPath = getCssPath(depth);
    
    if (fs.existsSync("templates/header.html")) {
        return fs.readFileSync("templates/header.html", "utf-8");
    }
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MathTrauma Blog</title>
    <link rel="stylesheet" href="${cssPath}">
</head>
<body class="blog-shell">
<div class="site-frame">
    <nav class="top-nav">
        <div class="nav-inner">
            <a href="/" class="brand">MathTrauma</a>
            <div class="nav-links">
                ${CATEGORIES.map(c => {
                    const encodedPath = encodeURIComponent(c);
                    return `<a href="/${encodedPath}/index.html">${c}</a>`;
                }).join('')}
            </div>
        </div>
    </nav>
`;
}

const TEMPLATE_HEADER = getTemplateHeader(0); // 루트용
const TEMPLATE_HEADER_SUB = getTemplateHeader(1); // 서브 폴더용

const TEMPLATE_FOOTER = fs.existsSync("templates/footer.html") ? fs.readFileSync("templates/footer.html", "utf-8") : `
    <footer class="footer">
        <p>&copy; 2024 MathTrauma Blog. All rights reserved.</p>
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
        // HTML에서 <h1> 태그로 제목 추출
        const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (h1Match) {
            return h1Match[1].replace(/<[^>]+>/g, '').trim();
        }
        // <title> 태그에서 추출
        const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
        if (titleMatch) {
            return titleMatch[1].trim();
        }
    }
    return "Untitled";
}

function slugify(text) {
    return text.toLowerCase().trim().replace(/\s+/g, "-");
}

// 파일 수정 시간 비교 함수
function needsRebuild(srcPath, htmlPath) {
    if (!fs.existsSync(htmlPath)) return true;
    
    const srcTime = fs.statSync(srcPath).mtime;
    const htmlTime = fs.statSync(htmlPath).mtime;
    
    return srcTime > htmlTime;
}

// marked 설정
marked.setOptions({
    gfm: true,
    breaks: true,
});

function copyAssets() {
    const cssSrc = "trauma.css";
    const cssDest = path.join(OUTPUT_DIR, "trauma.css");

    if (fs.existsSync(cssSrc)) {
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
    // 실제 폴더명 그대로 사용
    const categoryFolderName = categoryRaw;
    
    const srcFolder = path.join(POST_DIR, categoryFolderName);
    const outFolder = path.join(OUTPUT_DIR, categoryFolderName);

    ensureDir(outFolder);
    
    if (!fs.existsSync(srcFolder)) {
        console.warn(`⚠️  Source folder not found: ${srcFolder}`);
        return;
    }

    // .md와 .html 파일 모두 처리 (index.html 제외)
    const allFiles = fs.readdirSync(srcFolder);
    console.log(`📂 ${categoryFolderName} 폴더의 모든 파일:`, allFiles);
    
    const files = allFiles.filter(f => {
        const isTargetFile = (f.endsWith(".md") || f.endsWith(".html"));
        const isNotIndex = f !== "index.html"; // index.html은 카테고리 인덱스와 충돌 방지
        return isTargetFile && isNotIndex;
    });
    console.log(`📝 처리할 파일 (${files.length}개):`, files);
    
    const posts = [];
    let rebuiltCount = 0;

    for (const file of files) {
        const srcPath = path.join(srcFolder, file);
        const isMarkdown = file.endsWith(".md");

        let content = "";
        try {
            content = fs.readFileSync(srcPath, "utf-8");
        } catch (err) {
            console.error(`Failed to process ${file}:`, err.message);
            continue;
        }

        const title = extractTitle(content, isMarkdown);
        const slug = slugify(title);
        const outPath = path.join(outFolder, `${slug}.html`);

        // 증분 빌드 체크
        if (!forceRebuild && !needsRebuild(srcPath, outPath)) {
            posts.push({ title, slug });
            continue;
        }

        let htmlBody = "";
        
        if (isMarkdown) {
            // Markdown 파일 처리
            try {
                htmlBody = marked.parse(content);
            } catch (e) {
                htmlBody = marked(content);
            }

            const output = `
${TEMPLATE_HEADER_SUB}
<div class="article-shell">
    <aside class="toc">
        <h4>목차</h4>
        <ul>
            <li><a href="#top">맨 위로</a></li>
        </ul>
    </aside>
    
    <main>
        <article class="article-body">
            <h1>${escapeHtml(title)}</h1>
            ${htmlBody}
        </article>
    </main>
    
    <aside class="article-aside">
        <div class="panel">
            <h4>카테고리</h4>
            <p><a href="index.html">← ${categoryFolderName}</a></p>
        </div>
    </aside>
</div>
${TEMPLATE_FOOTER}
`;
            fs.writeFileSync(outPath, output, "utf-8");
        } else {
            // HTML 파일 처리
            // 이미 완전한 HTML 문서인 경우 그대로 복사
            if (content.includes('<!DOCTYPE') || content.includes('<html')) {
                fs.writeFileSync(outPath, content, "utf-8");
            } else {
                // HTML 프래그먼트인 경우 템플릿으로 감싸기
                const output = `
${TEMPLATE_HEADER_SUB}
<main class="blog-container">
<article class="blog-post">
${content}
</article>
</main>
${TEMPLATE_FOOTER}
`;
                fs.writeFileSync(outPath, output, "utf-8");
            }
        }

        rebuiltCount++;
        console.log(`✅ Rendered: ${categoryFolderName}/${file} -> ${slug}.html`);

        posts.push({ title, slug });
    }

    if (rebuiltCount > 0) {
        console.log(`📁 ${categoryFolderName}: ${rebuiltCount} files rebuilt`);
    }

    // category index
    let indexHtml = `
${TEMPLATE_HEADER_SUB}
<div class="hero-band">
    <div class="hero-grid">
        <div>
            <div class="eyebrow">카테고리</div>
            <h1 class="hero-title">${categoryFolderName}</h1>
            <p class="hero-lede">총 ${posts.length}개의 포스트</p>
        </div>
    </div>
</div>

<div class="page-grid">
    <main class="post-feed">
        <div class="card-grid">
`;

    if (posts.length === 0) {
        indexHtml += `
            <div class="panel">
                <p>아직 게시물이 없습니다.</p>
            </div>
        `;
    } else {
        for (const post of posts) {
            indexHtml += `
            <a href="${post.slug}.html" class="post-card">
                <div class="card-kicker">${categoryFolderName}</div>
                <h3>${escapeHtml(post.title)}</h3>
            </a>
            `;
        }
    }

    indexHtml += `
        </div>
    </main>
    
    <aside class="sidebar">
        <div class="panel">
            <h4>카테고리</h4>
            <ul class="bullet-list">
                ${CATEGORIES.map(c => {
                    const encodedPath = encodeURIComponent(c);
                    return `<li><a href="/${encodedPath}/index.html">${c}</a></li>`;
                }).join('')}
            </ul>
        </div>
    </aside>
</div>
${TEMPLATE_FOOTER}
`;

    fs.writeFileSync(path.join(outFolder, "index.html"), indexHtml, "utf-8");
}

function buildRootIndex() {
    ensureDir(OUTPUT_DIR);

    const html = `
${TEMPLATE_HEADER}
<div class="hero-band">
    <div class="hero-grid">
        <div>
            <div class="eyebrow">환영합니다</div>
            <h1 class="hero-title">MathTrauma Blog</h1>
            <p class="hero-lede">수학, 알고리즘, 프로그래밍에 대한 이야기</p>
        </div>
        <div class="hero-panel">
            <strong>카테고리</strong>
            <p>관심 있는 주제를 선택하세요</p>
        </div>
    </div>
</div>

<div class="page-grid">
    <main class="post-feed">
        <div class="card-grid">
            ${CATEGORIES.map(c => {
                const encodedPath = encodeURIComponent(c);
                return `
                <a href="${encodedPath}/index.html" class="post-card">
                    <div class="card-kicker">카테고리</div>
                    <h3>${c}</h3>
                    <p class="card-excerpt">포스트 보러가기 →</p>
                </a>
                `;
            }).join('')}
        </div>
    </main>
    
    <aside class="sidebar">
        <div class="panel">
            <h4>About</h4>
            <p>수학과 프로그래밍, 그리고 알고리즘에 대한 깊이 있는 탐구</p>
        </div>
    </aside>
</div>
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
            renderCategory(category, false);
        }
        buildRootIndex();
    }
}

main();