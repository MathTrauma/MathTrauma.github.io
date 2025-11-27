import fs from "fs";
import path from "path";
import { marked } from "marked";

const POST_DIR = "posts";
const OUTPUT_DIR = "dist";

const CATEGORIES = ["unity", "Problems%20And%20Solutions", "algorithm", "analysis", "complex", "geometry"];
const TEMPLATE_HEADER = fs.readFileSync("templates/header.html", "utf-8");
const TEMPLATE_FOOTER = fs.readFileSync("templates/footer.html", "utf-8");

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
        const match = line.match(/^#\s*(.+)/);
        if (match) {
            return match[1].trim();
        }
    }
    return "Untitled";
}

function slugify(text) {
    return encodeURIComponent(text.toLowerCase().replace(/\s+/g, "-"));
}

// 파일 수정 시간 비교 함수
function needsRebuild(mdPath, htmlPath) {
    if (!fs.existsSync(htmlPath)) return true;
    
    const mdTime = fs.statSync(mdPath).mtime;
    const htmlTime = fs.statSync(htmlPath).mtime;
    
    return mdTime > htmlTime;
}

// ★ marked 설정 — Prism.js 코드블록 처리를 위함
marked.setOptions({
    gfm: true,
    breaks: true,
    langPrefix: "language-",
    highlight: function(code, lang) {
        // Prism이 직접 하이라이트하므로 여기서는 변형하지 않는다.
        return code;
    }
});

// ★ trauma.css 복사
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
}

function renderCategory(category, forceRebuild = false) {
    const srcFolder = path.join(POST_DIR, category);
    const outFolder = path.join(OUTPUT_DIR, category);

    ensureDir(outFolder);
    ensureDir(srcFolder);

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
        const slug = `${slugify(title)}-${Date.now()}`;
        const outPath = path.join(outFolder, `${slug}.html`);

        // 증분 빌드: 파일이 변경되지 않았으면 스킵
        if (!forceRebuild && !needsRebuild(mdPath, outPath)) {
            console.log(`⏭️  Skipping ${file} (already up-to-date)`);
            posts.push({ title, slug });
            continue;
        }

        const htmlBody = marked(markdown);

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
        console.log(`✅ Rendered ${file}`);

        posts.push({ title, slug });
    }

    console.log(`📁 ${category}: ${rebuiltCount}/${files.length} files rebuilt`);

    // category index
    let indexHtml = `
${TEMPLATE_HEADER}
<main class="blog-container">
<h1>${category.toUpperCase()}</h1>
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

// 특정 파일만 렌더링
function renderSingleFile(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const parts = normalizedPath.split('/');
    
    if (parts.length < 2 || parts[0] !== 'posts') {
        console.error('Usage: node render.mjs --file posts/category/file.md');
        return;
    }

    const category = parts[1];
    const fileName = parts[parts.length - 1];

    if (!CATEGORIES.includes(category)) {
        console.error(`Category "${category}" not found`);
        return;
    }

    const mdPath = path.join(POST_DIR, category, fileName);
    
    if (!fs.existsSync(mdPath)) {
        console.error(`File not found: ${mdPath}`);
        return;
    }

    console.log(`🎯 Rendering single file: ${filePath}`);
    renderCategory(category, true);
    buildRootIndex();
    console.log('✨ Single file rendering complete.');
}

// dist/index.html
function buildRootIndex() {
    ensureDir(OUTPUT_DIR);

    const html = `
${TEMPLATE_HEADER}
<main class="blog-container">
<h1>MathTrauma Blog</h1>
<ul>
${CATEGORIES.map(c => `<li><a href="${c}/index.html">${c}</a></li>`).join("")}
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

    // CLI 옵션 처리
    if (args[0] === '--file' && args[1]) {
        // node render.mjs --file posts/unity/my-post.md
        renderSingleFile(args[1]);
    } else if (args[0] === '--category' && args[1]) {
        // node render.mjs --category unity
        console.log(`🎯 Rendering category: ${args[1]}`);
        renderCategory(args[1]);
        buildRootIndex();
        console.log('✨ Category rendering complete.');
    } else if (args[0] === '--force') {
        // node render.mjs --force (전체 강제 재빌드)
        console.log('🔄 Force rebuilding all files...');
        for (const category of CATEGORIES) {
            renderCategory(category, true);
        }
        buildRootIndex();
        console.log('✨ Force rebuild complete.');
    } else {
        // node render.mjs (증분 빌드)
        console.log('🚀 Starting incremental build...');
        for (const category of CATEGORIES) {
            renderCategory(category, false);
        }
        buildRootIndex();
        console.log('✨ Incremental build complete.');
    }
}

main();