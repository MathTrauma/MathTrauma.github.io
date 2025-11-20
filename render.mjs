import fs from "fs";
import path from "path";
import { marked } from "marked";

const POST_DIR = "posts";
const OUTPUT_DIR = "dist";

const CATEGORIES = ["unity", "visualized-math", "algorithm", "analysis", "complex", "geometry"];
const TEMPLATE_HEADER = fs.readFileSync("templates/header.html", "utf-8");
const TEMPLATE_FOOTER = fs.readFileSync("templates/footer.html", "utf-8");

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
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
        if (line.startsWith("# ")) {
            return line.replace("# ", "").trim();
        }
    }
    return "Untitled";
}

function slugify(text) {
    return encodeURIComponent(text.toLowerCase().replace(/\s+/g, "-"));
}

function renderCategory(category) {
    const srcFolder = path.join(POST_DIR, category);
    const outFolder = path.join(OUTPUT_DIR, category);

    // 출력 폴더 자동 생성
    ensureDir(outFolder);

    // posts/{category} 자동 생성
    ensureDir(srcFolder);

    const files = fs.readdirSync(srcFolder).filter(f => f.endsWith(".md"));
    const posts = [];

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

        const outPath = path.join(outFolder, `${slug}.html`);
        fs.writeFileSync(outPath, output, "utf-8");

        posts.push({ title, slug });
    }

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


// ★ dist/ 루트에 index.html 생성 — GitHub Pages 404 해결 핵심
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
    ensureDir(OUTPUT_DIR);

    for (const category of CATEGORIES) {
        renderCategory(category);
    }

    // ★ 루트 index.html 생성
    buildRootIndex();

    console.log("Rendering complete.");
}

main();
