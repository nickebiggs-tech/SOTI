# SOTI Project - Setup Guide

## Prerequisites
- Node.js (v16+)
- npm
- Git
- GitHub access to the `nickebiggs-tech/SOTI` repo (ask Nick to add you as a collaborator)

## Getting Started

```bash
# 1. Clone the repo
git clone https://github.com/nickebiggs-tech/SOTI.git
cd SOTI

# 2. Switch to our working branch
git checkout claude/soti-drill-downs-sku-A4CLi

# 3. Install dependencies
npm install

# 4. Run locally
npm start
```

The app will open at `http://localhost:3000/SOTI/`

## Deploying Changes

```bash
# After making edits:
git add .
git commit -m "Description of changes"
git push origin claude/soti-drill-downs-sku-A4CLi

# Deploy to live site
npm run deploy
```

Live site: https://nickebiggs-tech.github.io/SOTI/

## Project Structure

```
src/
├── pages/          # Main page components (Login, Dispense, OTC, etc.)
├── components/     # Shared components (BottomNav, Header, etc.)
├── data/           # Mock data files
├── styles/         # CSS files
└── App.js          # Router and app shell
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `npm start` | Run locally |
| `npm run build` | Production build |
| `npm run deploy` | Deploy to GitHub Pages |
