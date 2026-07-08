# VB Portfolio

## Before you run it
Drop these two files into the `public/` folder (they're referenced by the site but not included here):
- `profile.jpg` — your headshot
- `Resume.pdf` — your resume

## Run it on macOS

1. **Install Node.js** (skip if you already have it — check with `node -v` in Terminal):
   - Easiest: download the LTS installer from https://nodejs.org and run it, or
   - Via Homebrew: `brew install node`

2. **Unzip this project**, then in Terminal:
   ```bash
   cd vb-portfolio
   npm install
   npm run dev
   ```

3. Open the URL it prints (usually `http://localhost:5173`) in your browser.

Any time you edit a file in `src/`, the page updates automatically — no restart needed.

## When you're happy with it
```bash
npm run build
```
This outputs a `dist/` folder of static files you can deploy anywhere (GitHub Pages, Vercel, Netlify, etc.) instead of `vb-1405.github.io` if you want this to replace or sit alongside your current site.
