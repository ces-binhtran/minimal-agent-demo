# Project Structure

## Overview

Visualization of the file and folder organization for the Knowledge Ownership Agent project.

```
minimal-agent-demo/
│
├── 📁 src/                          # Source code
│   ├── 📁 agent/                    # LangGraph agent implementation
│   │   ├── graph.ts                 # Graph definition & compilation
│   │   ├── state.ts                 # State schema with reducers
│   │   ├── mysql-saver.ts           # MySQL checkpointer
│   │   │
│   │   ├── 📁 nodes/                # 7 agent nodes
│   │   │   ├── orchestrator.ts      # Node 1: Initialize context
│   │   │   ├── guardrail.ts         # Node 2: Check query validity
│   │   │   ├── intent-parser.ts     # Node 3: Classify user intent
│   │   │   ├── query-planner.ts     # Node 4: Plan tool execution
│   │   │   ├── tool-executor.ts     # Node 5: Execute tools
│   │   │   ├── reflector.ts         # Node 6: Validate completeness
│   │   │   └── response-generator.ts # Node 7: Generate response
│   │   │
│   │   └── 📁 prompts/              # YAML prompt templates
│   │       ├── orchestrator.yaml
│   │       ├── guardrail.yaml
│   │       ├── intent-parser.yaml
│   │       ├── query-planner.yaml
│   │       ├── reflector.yaml
│   │       └── response-generator.yaml
│   │
│   ├── 📁 tools/                    # Agent tools (5 mock tools)
│   │   ├── index.ts                 # Tool registry
│   │   ├── module-ownership.ts      # Get module ownership
│   │   ├── all-modules.ts           # List all modules
│   │   ├── bus-factor.ts            # Calculate bus factor
│   │   ├── risk-modules.ts          # Get high-risk modules
│   │   └── developer-expertise.ts   # Get developer expertise
│   │
│   └── 📁 api/                      # API routes (Next.js)
│       └── chat/
│           └── route.ts             # POST /api/chat endpoint
│
├── 📁 app/                          # Next.js pages & UI
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page (chat interface)
│   ├── globals.css                  # Global styles
│   │
│   └── 📁 components/               # React components
│       ├── ChatInterface.tsx        # Main chat UI
│       ├── MessageList.tsx          # Message display
│       ├── ThoughtProcess.tsx       # Agent trace visualization
│       └── ThreadHistory.tsx        # Conversation history sidebar
│
├── 📁 docs/                         # Architecture documentation
│   ├── README.md                    # Documentation index
│   ├── c4-context.md                # C4 Level 1: System context
│   ├── c4-container.md              # C4 Level 2: Containers
│   ├── c4-component.md              # C4 Level 3: Components
│   ├── project-structure.md         # This file
│   └── langgraph-vs-google-adk.md   # Framework comparison
│
├── 📁 database/                     # Database setup
│   ├── schema.sql                   # MySQL table definitions
│   └── migrations/                  # Schema migrations
│
├── 📁 tests/                        # Test files
│   ├── unit/                        # Unit tests
│   ├── integration/                 # Integration tests
│   └── run-eval.ts                  # Evaluation script
│
├── 📁 public/                       # Static assets
│   └── images/
│
├── 📄 HANDBOOK.md                   # Learning notes & team guide
├── 📄 README.md                     # Project overview
├── 📄 package.json                  # Dependencies & scripts
├── 📄 tsconfig.json                 # TypeScript config
├── 📄 .env                          # Environment variables
└── 📄 .gitignore                    # Git ignore rules
```

---

## Key Directories Explained

### `src/agent/` - Agent Implementation

The heart of the LangGraph agent.

| File/Folder | Purpose | Key Exports |
|-------------|---------|-------------|
| `graph.ts` | Compiles the 7-node workflow | `createGraph()`, `runAgent()` |
| `state.ts` | State schema with custom reducers | `AgentState` |
| `mysql-saver.ts` | Checkpoint persistence | `MySQLSaver` class |
| `nodes/` | 7 node implementations | Each exports `async function nodeNameNode(state)` |
| `prompts/` | COSTAR-formatted YAML prompts | Loaded by nodes |

**Key Pattern**: Each node file exports a single async function matching signature:
```typescript
async function nodeName(state: AgentState): Promise<Partial<AgentState>>
```

---

### `src/tools/` - Agent Tools

Mock implementations of code analysis tools.

| Tool | What It Returns | Example |
|------|-----------------|---------|
| `module-ownership.ts` | Ownership distribution for a module | `{ Alice: 85%, Bob: 15% }` |
| `all-modules.ts` | List of all modules | `["auth", "payment", "core"]` |
| `bus-factor.ts` | Bus factor metrics | `{ factor: 2, at_risk_modules: 3 }` |
| `risk-modules.ts` | High-risk modules | `[{ name: "legacy-payment", risk: "high" }]` |
| `developer-expertise.ts` | Developer expertise areas | `{ Alice: ["auth", "payment"] }` |

**Implementation Status**: Currently using **mock/deterministic data** (not real Git analysis)

**Future**: Replace with actual `git blame` and repository analysis

---

### `app/` - Next.js UI

User-facing chat interface.

| Component | Responsibility |
|-----------|----------------|
| `ChatInterface.tsx` | Main chat UI, manages messages array |
| `MessageList.tsx` | Renders conversation history |
| `ThoughtProcess.tsx` | Expandable agent trace (shows internal steps) |
| `ThreadHistory.tsx` | Sidebar with recent conversations |

**Tech Stack**:
- Next.js 14 (App Router)
- React Server Components
- TailwindCSS for styling
- `useChat` hook for state management

---

### `docs/` - Architecture Documentation

C4 model diagrams and design decisions.

| Document | Content |
|----------|---------|
| `c4-context.md` | System context (users, external systems) |
| `c4-container.md` | Technology containers (UI, API, Agent, DB) |
| `c4-component.md` | Internal agent components (7 nodes + supporting) |
| `project-structure.md` | This file |
| `langgraph-vs-google-adk.md` | Framework comparison |

**Why C4 Model?** Provides 3 levels of zoom (Context → Container → Component) for different audiences

---

### `database/` - Database Setup

MySQL schema and migrations.

**Current Schema**:
```sql
CREATE TABLE checkpoints (
  thread_id VARCHAR(255),
  checkpoint_id VARCHAR(255),
  checkpoint JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (thread_id, checkpoint_id),
  INDEX idx_thread_created (thread_id, created_at)
);

CREATE TABLE threads (
  thread_id VARCHAR(255) PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP,
  user_id VARCHAR(255)
);
```

**Setup**:
```bash
mysql -u root -p < database/schema.sql
```

---

### `tests/` - Testing

Test suites for agent validation.

| Directory | What It Tests |
|-----------|---------------|
| `unit/` | Individual node functions (mocked LLM) |
| `integration/` | Full graph execution (end-to-end) |
| `run-eval.ts` | Evaluation dataset runner |

**Current Status**: Limited testing (1 eval script)

**Needs**: Unit tests for all 7 nodes, integration tests, browser tests

---

## File Naming Conventions

### TypeScript Files
- `kebab-case.ts` for files with multiple exports
- `PascalCase.tsx` for React components
- Node files use descriptive names: `intent-parser.ts`, not `node3.ts`

### Prompt Files
- `kebab-case.yaml` matching node names
- Example: `guardrail.yaml` for `guardrail.ts`

### Test Files
- `*.test.ts` for unit tests
- `*.spec.ts` for integration tests
- `run-eval.ts` for evaluation scripts

---

## Import Paths

### Absolute Imports (Configured in `tsconfig.json`)
```typescript
import { AgentState } from "@/agent/state";
import { guardrailNode } from "@/agent/nodes/guardrail";
import { TOOLS } from "@/tools";
```

**Why?** Cleaner than relative imports (`../../../agent/state`)

---

## Environment Variables (`.env`)

```bash
# LLM Provider
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...  # Optional fallback

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=agent_db

# Application
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Security**: Never commit `.env` to Git (in `.gitignore`)

---

## Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "next dev",               // Start dev server (localhost:3000)
    "build": "next build",           // Build for production
    "start": "next start",           // Run production build
    "test": "vitest",                // Run unit tests
    "test:eval": "ts-node tests/run-eval.ts",  // Run evaluation
    "lint": "eslint .",              // Lint code
    "format": "prettier --write ."   // Format code
  }
}
```

---

## Build Output

```
.next/                    # Next.js build cache (gitignored)
node_modules/             # NPM dependencies (gitignored)
dist/                     # TypeScript compilation output (future)
```

---

## Code Organization Principles

### 1. Single Responsibility
- Each node file = one node function
- Each tool file = one tool
- Each component file = one React component

### 2. Explicit Dependencies
- No circular imports
- Clear dependency tree: `graph.ts` → `nodes/` → `tools/` → `prompts/`

### 3. Separation of Concerns
- **Agent logic**: `src/agent/`
- **UI logic**: `app/`
- **Tools**: `src/tools/`
- **Documentation**: `docs/`

### 4. Configuration as Code
- Prompts in YAML (not hardcoded strings)
- Environment variables in `.env`
- Database schema in `schema.sql`

---

## Growth Path

As the project grows, consider:

### When to Split Files
- Node file > 200 lines → Extract helper functions to `utils/`
- Tool file > 150 lines → Split into `tool-name/index.ts` + `tool-name/logic.ts`
- Component file > 250 lines → Extract sub-components

### When to Add Folders
- More than 3 helper files → Create `src/utils/`
- More than 5 config files → Create `config/`
- More than 10 test files → Split into `unit/`, `integration/`, `e2e/`

---

## Related Documentation

- [C4 Context Diagram](./c4-context.md) - System boundaries
- [C4 Container Diagram](./c4-container.md) - Technology architecture
- [C4 Component Diagram](./c4-component.md) - Internal agent structure
- [Handbook](../HANDBOOK.md) - Learning notes & team guide

---

**Quick Navigation**:
- 🏠 [Documentation Home](./README.md)
- 📊 [Context Diagram](./c4-context.md)
- 🛠 [Container Diagram](./c4-container.md)
- 🔍 [Component Diagram](./c4-component.md)
