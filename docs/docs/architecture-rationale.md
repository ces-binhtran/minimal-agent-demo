# Architecture Design Decisions

This document explains the **WHY** behind the architecture shown in the C4 diagrams.

## Overview

**What**: Our agent has a 7-node graph architecture  
**Why**: Each node has one responsibility, making it debuggable and testable  
**Trade-offs**: Higher latency (6 LLM calls) but full transparency

---

## Design Principles

### 1. Single Responsibility Per Node

**Principle**: Each node does ONE thing well.

**Example**:
- ❌ Bad: "Worker Node" that parses intent + plans tools + executes tools
- ✅ Good: Separate nodes for Intent Parser, Query Planner, Tool Executor

**Why**: Easier to debug, test, and modify independently.

---

### 2. Fail Fast, Fail Clear

**Principle**: Block bad inputs early, provide clear errors.

**Example**:
- Guardrail is **Node 2** (not Node 5) → blocks off-topic queries immediately
- Saves 4 LLM calls + tool execution on invalid queries

**Edge Case Handled**: User asks "What's the weather?" → Blocked at Guardrail, costs $0.001 instead of $0.04

---

### 3. Explicit > Implicit

**Principle**: Make control flow visible (graphs > loops).

**Example**:
```typescript
// ❌ Implicit: Hidden in while loop
while (!done) {
  result = await agent.run();
  done = result.isComplete; // Who knows when this is true?
}

// ✅ Explicit: Graph shows routing
reflectorNode → routes to:
  - query_planner (if need more data)
  - response_generator (if complete)
```

**Why**: Team can visualize flow, UI can show thought process.

---

## Key Decisions Explained

### Why Separate Planner and Executor?

**Scenario**: User asks "Who owns payment module?"

**Option 1: Combined Node**
```typescript
async function planAndExecute(state) {
  const tools = selectTools(state.intent); // Planning
  const results = await executeTools(tools); // Execution
  return { results };
}
```
**Problems**:
- Hard to test planning logic independent of execution
- Can't retry failed tools without re-planning
- Mixed concerns

**Option 2: Separate Nodes** ✅
```typescript
async function queryPlannerNode(state) { /* Just planning */ }
async function toolExecutorNode(state) { /* Just execution */ }
```
**Benefits**:
- Test planner with mocked tools
- Retry failed tools without re-planning
- Clear separation of concerns

---

### Why Reflector Node?

**Problem**: Sometimes need multiple tool calls.

**Example Query**: "Who owns payment AND auth?"

**Without Reflector**:
```
Intent Parser → Query Planner → Tool Executor → Response Generator
                   ↓
              Calls get_ownership("payment") only
              ↓
           Misses "auth" module
```

**With Reflector**:
```
Tool Executor → Reflector: "Do we have ownership for both modules?"
                   ↓
              Reflector: "No, missing auth"
                   ↓
              Routes back to Query Planner
                   ↓
              Planner: get_ownership("auth")
                   ↓
              Tool Executor → Reflector: "Now complete!" → Response Generator
```

**Edge Case Handled**: Multi-entity queries need 2+ iterations

---

## Edge Cases & Solutions

### 1. User Sends Empty Message

**What Happens**:
- Orchestrator → Guardrail → classifies as `ambiguous`
- Guardrail allows (not off-topic)
- Intent Parser → `greeting_or_help`
- Query Planner → **no tools needed**
- Routes directly to Response Generator
- Response: "Hi! How can I help?"

**LLM Calls**: 3 (Guardrail, Intent, Response)

---

### 2. Database Connection Fails

**What Happens**:
- Tool Executor tries to call `get_module_ownership`
- MySQL connection timeout
- Catch error → return `{ status: 'error', message: '...' }`
- Reflector sees error status → routes to Response Generator
- Response: "I encountered a database issue. Please try again."

**User Experience**: Graceful error message, not a crash

---

### 3. Infinite Loop Prevention

**Scenario**: Reflector keeps saying "need more data"

**Solution**:
```typescript
function reflectorNode(state) {
  if (state.iterations >= 5) {
    // Force exit after 5 iterations
    return "response_generator";
  }
  // ... normal logic
}
```

**Real Test**: Never seen >1 iteration in 12 test queries

---

## Metrics That Influenced Design

| Decision | Metric | Value | Impact |
|----------|--------|-------|--------|
| Guardrail first | Blocked queries | 16.7% (2/12) | Saved $0.08 |
| Separate Planner/Executor | Failed tools | 0/12 | Easy retry if needed |
| 7 nodes (not 3) | Debugging time | ~5 min/bug | Can pinpoint node |
| Max iterations = 5 | Infinite loops | 0/12 | Zero runaway costs |

---

## What We'd Change (Lessons Learned)

### 1. Add Streaming Earlier

**Current**: Wait for all 7 nodes → 9s latency  
**Better**: Stream after each node  
**Why Not**: Complexity (will add in v2)

### 2. Parallelize Guardrail + Intent

**Current**: Sequential (Guardrail → Intent)  
**Optimization**: Run both in parallel, gate at Query Planner  
**Savings**: ~2 seconds  
**Why Not Yet**: LangGraph parallel edges = more complex state management

### 3. Cache Common Queries

**Current**: Every "What's the bus factor?" → 6 LLM calls  
**Better**: Redis cache for repeated queries  
**Savings**: 68% cost reduction on repeated queries  
**Status**: TODO

---

## Comparison with Alternatives

### Our 7-Node Architecture

**Pros**:
- Explicit, visible, debuggable
- Each node independently testable
- Can optimize individual nodes (cheaper LLMs for simple tasks)

**Cons**:
- 5-6 LLM calls per query (latency + cost)
- More code to maintain

### Alternative: Simple 3-Node Chain

**Pros**:
- Less code, faster (3 LLM calls)

**Cons**:
- Black box behavior
- Hard to debug failures
- Can't optimize individual steps

### Alternative: Google ADK Multi-Agent

**Pros**:
- Built-in optimizations (streaming, parallel)

**Cons**:
- Less explicit (more "magic")
- Vendor lock-in
- Harder to understand for learning

**Our Choice**: 7 nodes = right trade-off for **transparency during learning**.

---

## References

See C4 diagrams at http://localhost:8080 for visual representation.

- [ADR-003: 7-Node Architecture](../adrs/0003-seven-node-architecture.md)
- [Component Diagram](../c4-component.md)
- [Implementation](../../src/agent/graph.ts)
