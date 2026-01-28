# Architecture Documentation

> Interactive architecture diagrams built with [Structurizr](https://structurizr.com/) and the C4 model.

## 🌐 View Architecture Website

### Option 1: Generate Static Site Locally

```bash
# 1. Install Structurizr Site Generatr
# Download from: https://github.com/structurizr/cli/releases
# Or use Docker:
docker pull structurizr/lite

# 2. Generate site
docker run -it --rm -p 8080:8080 \
  -v $(pwd)/docs:/usr/local/structurizr \
  structurizr/lite

# 3. Open browser
open http://localhost:8080
```

### Option 2: Use Structurizr CLI

```bash
# Install Structurizr CLI
brew install structurizr-cli  # macOS
# or download from https://github.com/structurizr/cli

# Generate static site
structurizr-cli export -workspace docs/workspace.dsl -format site -output site/

# Serve locally
cd site && python3 -m http.server 8000
open http://localhost:8000
```

---

## 📊 C4 Model Views

Our architecture documentation includes 4 views:

1. **System Landscape** - All systems and people
2. **System Context** - Knowledge Ownership Agent in its environment
3. **Container Diagram** - High-level technology choices (Next.js, LangGraph, MySQL)
4. **Component Diagram** - Internal structure of the 7-node agent graph

---

## 📁 Files

```
docs/
├── workspace.dsl           # Structurizr DSL definition (source of truth)
├── README.md               # This file
├── docs/                   # Markdown documentation (ADRs, guides)
└── adrs/                   # Architecture Decision Records
```

---

## 🎨 C4 Model Explained

The C4 model provides 4 levels of architectural detail:

| Level | Scope | Audience |
|-------|-------|----------|
| **Context** | System boundaries | Everyone |
| **Container** | Technology choices | Tech leads, architects |
| **Component** | Internal structure | Developers |
| **Code** | Class diagrams | Developers (optional) |

We implement the first 3 levels in `workspace.dsl`.

---

## 🛠️ Editing the Architecture

### Update Diagrams

1. Edit `workspace.dsl` using Structurizr DSL syntax
2. Regenerate the site (see commands above)
3. Refresh browser to see changes

### Structurizr DSL Syntax

```dsl
# Define a person
person "Engineer" "Asks questions"

# Define a software system
softwareSystem "Agent" "AI-powered agent" {
  # Define a container
  container "Web UI" "Chat interface" "Next.js"
}

# Define relationships
person -> system "Uses"
```

See [Structurizr DSL Language Reference](https://docs.structurizr.com/dsl/language) for full syntax.

---

## 📝 Add Documentation

### Architecture Decision Records (ADRs)

Create ADRs in `docs/adrs/`:

```markdown
# ADR-001: Use LangGraph for Agent Orchestration

## Status
Accepted

## Context
We needed a framework for building stateful AI agents...

## Decision
We chose LangGraph because...

## Consequences
- Pro: Explicit control flow
- Con: Steeper learning curve
```

ADRs will automatically appear in the generated site.

### General Documentation

Add markdown files to `docs/docs/`:

- `deployment.md` - Deployment guide
- `development.md` - Development setup
- `testing.md` - Testing strategy

---

## 🚀 Deployment (Optional)

### GitHub Pages

```bash
# Generate static site
structurizr-cli export -workspace docs/workspace.dsl -format site -output site/

# Push to gh-pages branch
git subtree push --prefix site origin gh-pages
```

Your architecture site will be available at: `https://yourusername.github.io/repo-name/`

---

## 📚 Resources

- [Structurizr Documentation](https://docs.structurizr.com/)
- [C4 Model](https://c4model.com/)
- [Structurizr DSL Cookbook](https://docs.structurizr.com/dsl/cookbook)
- [Example: note-taker workspace.dsl](https://github.com/vukhanhtruong/note-taker/blob/main/docs/workspace.dsl)

---

## 🔗 Quick Links

- **Main Handbook**: [HANDBOOK.md](../HANDBOOK.md)
- **LangGraph vs Google ADK**: [langgraph-vs-google-adk.md](./langgraph-vs-google-adk.md)
- **Project Structure**: [project-structure.md](./project-structure.md)

---

**Need help?** See [Structurizr Getting Started](https://docs.structurizr.com/getting-started) or ask the team!
