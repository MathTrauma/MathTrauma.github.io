# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Pages blog built with a custom static site generator. The site features:
- Korean language content (blog posts about Unity, algorithms, and mathematical analysis)
- Three.js animated background on the main page
- Template-based rendering system
- Markdown and HTML post support
- MathJax for mathematical notation
- Prism.js for code syntax highlighting

## Build & Development Commands

### Building the site
```bash
npm run build              # Incremental build (only changed files)
npm run build:force        # Force rebuild all files
```

### Development workflow
```bash
npm run watch              # Auto-rebuild on file changes (watches posts/, templates/, *.css)
npm run serve              # Serve the dist/ folder locally (uses npx serve)
```

### Testing locally
After building, the output is in `dist/`. To test:
1. Run `npm run serve`
2. Visit the local URL provided by the serve command

## Architecture

### Build System (`render.mjs`)

The build script is a custom Node.js static site generator:

1. **Template System**: Uses a simple `{{VARIABLE}}` replacement system via `renderTemplate()` function
   - Templates are in `templates/` directory
   - Main templates: `header.html`, `footer.html`, `post_layout.html`, `category_index.html`, `root_index.html`

2. **Content Processing**:
   - Scans `posts/` directory for category folders
   - Each category folder contains `.md` or `.html` files
   - Markdown files are converted to HTML using the `marked` library
   - Title extraction: First `# Heading` in Markdown or first `<h1>` in HTML

3. **Output Structure**:
   - `dist/{category}/index.html` - Category listing page
   - `dist/{category}/{slug}.html` - Individual post pages (slug = slugified title)
   - `dist/index.html` - Homepage (currently commented out in build, using root `index.html` instead)

4. **Incremental Builds**: Compares file modification times (`needsRebuild()`) to skip unchanged posts

### Directory Structure

```
posts/
  {category}/           # e.g., algorithm/, unity/, analysis/, Problems And Solutions/
    *.md                # Markdown posts
    *.html              # HTML posts
templates/
  header.html           # Common header with navigation, MathJax, Prism.js
  footer.html           # Common footer
  post_layout.html      # Article layout with TOC and sidebar
  category_index.html   # Category listing page template
  root_index.html       # Homepage template
dist/                   # Build output (gitignored, deployed via GitHub Actions)
scripts/
  main.js               # Three.js setup loader
  threejsApp.js         # Three.js animated background
trauma.css              # Main stylesheet
index.html              # Custom homepage (not template-generated)
```

### Key Template Variables

- `{{CSS_PATH}}` - Relative path to trauma.css (calculated by depth)
- `{{NAV_LINKS}}` - Navigation links to all categories
- `{{TITLE}}` - Post title (HTML-escaped)
- `{{CONTENT_BODY}}` - Rendered markdown/HTML content
- `{{CATEGORY_NAME}}` - Category folder name
- `{{POST_COUNT}}` - Number of posts in category
- `{{POST_LIST_HTML}}` - Rendered list of post cards
- `{{ALL_CATEGORIES_LINKS}}` - Sidebar category links
- `{{CATEGORY_CARDS}}` - Homepage category cards

## Deployment

GitHub Actions workflow (`.github/workflows/render.yml`):
1. Triggers on push to `main` or manual dispatch
2. Runs `node render.mjs` to build the site
3. Copies static files (`index.html`, `trauma.css`, `scripts/`, `.nojekyll`) to `dist/`
4. Deploys `dist/` to GitHub Pages

**Important**: The root `index.html` is manually maintained and copied to `dist/` during deployment. The `buildRootIndex()` function in `render.mjs` is currently commented out (line 239).

## Adding New Content

### Creating a new post

1. Choose or create a category folder in `posts/`
2. Create a `.md` or `.html` file (do not name it `index.html`)
3. For Markdown: Start with `# Title` as the first heading
4. For HTML: Include `<h1>` or `<title>` tag for title extraction
5. Run `npm run build` - the slug is auto-generated from the title
6. Commit and push to deploy via GitHub Actions

### Creating a new category

1. Create a new folder in `posts/{category-name}/`
2. Add at least one post file
3. The category appears automatically in navigation
4. Update root `index.html` manually to add the category card in the features section

## Special Notes

- **URL Encoding**: Category names with spaces (e.g., "Problems And Solutions") are URL-encoded in links
- **CSS Paths**: Header template uses absolute path `/trauma.css`, overriding the `{{CSS_PATH}}` variable
- **Language**: Site is primarily in Korean (ko locale)
- **No Testing**: This repository does not have automated tests
- **Three.js**: Main page background uses Three.js loaded via ES modules from CDN
