# Quick Start: Generate Architecture Website

## Option 1: Docker (Easiest)

```bash
# From project root
docker run -it --rm -p 8080:8080 \
  -v $(pwd)/docs:/usr/local/structurizr \
  structurizr/lite

# Open in browser
open http://localhost:8080
```

Navigate through:
- **System Landscape** - See all systems
- **System Context** - Knowledge Ownership Agent boundaries
- **Containers** - Technology stack (Next.js, LangGraph, MySQL)
- **LangGraph Components** - 7-node architecture

## Option 2: Generate Static HTML

```bash
# Install Structurizr CLI
# Download from: https://github.com/structurizr/cli/releases

# Generate site
./structurizr-cli export \
  -workspace docs/workspace.dsl \
  -format site \
  -output site/

# Serve locally
cd site && python3 -m http.server 8000
open http://localhost:8000
```

## What You'll See

- **Click-through diagrams**: Click on elements to zoom in
- **Auto-layout**: Diagrams automatically organized
- **ADRs**: Architecture decisions documented
- **Color-coded nodes**: Each of the 7 agent nodes has a unique color

## Edit the Architecture

1. Edit `docs/workspace.dsl`
2. Refresh the Structurizr site
3. See changes instantly!

## Deploy to GitHub Pages (Optional)

```bash
# Generate static site
./structurizr-cli export -workspace docs/workspace.dsl -format site -output site/

# Commit and push
git add site/
git commit -m "Add architecture site"
git push

# Enable GitHub Pages
# Go to Settings → Pages → Source: Deploy from a branch
# Branch: main, Folder: /site
```

Your architecture will be live at: `https://yourusername.github.io/repo-name/`

---

**Need help?** See [docs/README.md](../docs/README.md) for detailed instructions.
