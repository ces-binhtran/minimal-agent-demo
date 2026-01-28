# 3. 7-Node Agent Architecture

Date: 2026-01-28

## Status

Accepted

## Context

We needed to design an agent workflow that could:
- Handle multi-step reasoning (plan → execute → reflect)
- Maintain conversation context
- Prevent infinite loops
- Be debuggable and transparent

We had to decide how many nodes and what each should do.

## Decision

We chose a **7-node architecture**:
1. Orchestrator - Initialize context
2. Guardrail - Block off-topic queries
3. Intent Parser - Classify user intent
4. Query Planner - Plan tool execution
5. Tool Executor - Execute tools
6. Reflector - Validate completeness
7. Response Generator - Create final answer

## Rationale

### Why 7 Nodes? (Not More, Not Less)

**Too Few Nodes (3-4)**:
- ❌ Combined nodes = mixed responsibilities (hard to test)
- ❌ Less visibility into agent reasoning
- Example: Combining Intent Parser + Query Planner would make debugging harder

**Too Many Nodes (10+)**:
- ❌ Over-complicated for our use case
- ❌ More LLM calls = higher latency & cost
- ❌ Harder to understand the flow

**7 Nodes = Sweet Spot**:
- ✅ Each node has **one clear responsibility** (Single Responsibility Principle)
- ✅ Enough granularity for debugging
- ✅ Not over-complicated

### Why These Specific Nodes?

#### 1. Orchestrator (Why Needed?)
**Problem**: First LLM call needs system context ("You are an agent...")  
**Edge Case**: Without it, agent doesn't know its role  
**Alternative Considered**: Add context in API layer → Rejected (mixing concerns)

#### 2. Guardrail (Why First?)
**Problem**: Users might ask off-topic queries (weather, jokes)  
**Edge Case**: Without it, agent wastes $ on irrelevant processing  
**Why Before Intent Parser**: Block early to save LLM costs  
**Alternative Considered**: Guardrail after Intent → Rejected (already spent tokens parsing intent)

#### 3. Intent Parser (Why Separate from Planner?)
**Problem**: Need to classify intent BEFORE planning tools  
**Edge Case**: Ambiguous queries ("payment") need clarification  
**If Combined with Planner**: Can't ask clarifying questions before tool selection  

#### 4. Query Planner (Why Not Just Execute All Tools?)
**Problem**: Don't always need all 5 tools (wastes time/money)  
**Edge Case**: "Who owns payment?" only needs 1 tool, not all 5  
**Alternative Considered**: Execute all tools → Rejected (slow, expensive)

#### 5. Tool Executor (Why Separate from Planner?)
**Problem**: Planning logic ≠ execution logic  
**Edge Case**: Tool failures need error handling (retry, fallback)  
**Testability**: Can mock tools in tests without mocking planner

#### 6. Reflector (Why Needed?)
**Problem**: Sometimes 1 tool isn't enough (need iterative data gathering)  
**Edge Case**: User asks "Who owns payment AND auth?" → need 2 tool calls  
**Without Reflector**: Agent stops after first tool (incomplete answer)  
**Critical**: Prevents infinite loops with max_iterations=5

#### 7. Response Generator (Why Last?)
**Problem**: Tool results are raw data, not user-friendly  
**Edge Case**: "busFactor: 2" needs context ("Your bus factor is 2, which means...")  
**Alternative Considered**: Return raw tool results → Rejected (terrible UX)

---

## Edge Cases & How We Handle Them

### 1. Infinite Loops
**Scenario**: Reflector keeps saying "need more data"  
**Solution**: Hard limit `if (iterations >= 5) → force exit`  
**Code**: `reflector.ts` line 23

### 2. Off-Topic Queries
**Scenario**: "What's the weather in Tokyo?"  
**Solution**: Guardrail blocks → immediate END (no tool execution)  
**Cost Saved**: ~$0.04 per blocked query

### 3. Ambiguous Queries
**Scenario**: User says just "payment"  
**Solution**: Intent Parser classifies as `ambiguous` → Response Generator asks for clarification  
**No Tools Executed**: Query Planner skipped

### 4. Tool Failures
**Scenario**: Database connection fails  
**Solution**: Tool Executor catches errors → returns `{ status: 'error', message: '...' }`  
**Reflector**: Sees error → routes to Response Generator with apology

### 5. Multiple Entities
**Scenario**: "Who owns payment AND auth?"  
**Solution**: Query Planner creates 2 tool calls → Tool Executor runs both → Reflector validates both complete  
**Iterations**: Usually 1, max observed = 2

### 6. Long Conversations
**Scenario**: 50+ messages in history  
**Solution**: Summarize old messages (keep last 5 turns)  
**Status**: Not yet implemented (TODO)

---

## Consequences

### Positive
- ✅ **Debuggable**: Can see exactly which node failed
- ✅ **Testable**: Each node independently unit-testable
- ✅ **Maintainable**: Change one node without affecting others
- ✅ **Transparent**: UI shows thought process (all 7 steps)

### Negative
- ❌ **Latency**: 5-6 LLM calls per query (~8-12 seconds total)
- ❌ **Cost**: $0.02-0.05 per query (GPT-4 for 4 nodes)
- ❌ **Complexity**: New developers need to understand 7 nodes

### Trade-offs Accepted
- **We accept higher latency** in exchange for transparency and debuggability
- **We accept more code** to maintain single responsibility per node
- **We accept 6 LLM calls** because each serves a clear purpose

---

## Alternatives Considered

### Alternative 1: Simple Chain (3 nodes)
```
Guardrail → Worker (does everything) → Response
```
**Rejected Because**: Black box, hard to debug

### Alternative 2: ReAct Pattern (5 nodes)
```
Thought → Action → Observation → Thought → Response
```
**Rejected Because**: Too generic, doesn't fit our use case well

### Alternative 3: Google ADK Multi-Agent
```
Orchestrator Agent → [Guardrail Agent, Analysis Agent, Response Agent]
```
**Rejected Because**: Over-engineered, we don't need hierarchical agents yet

---

## Metrics (12 Test Queries)

| Metric | Value |
|--------|-------|
| Avg Latency | 9.2 seconds |
| Avg Cost | $0.032/query |
| Avg LLM Calls | 5.8 calls |
| Guardrail Blocks | 2/12 queries (16.7%) |
| Iterations > 1 | 0/12 (single-pass sufficient) |
| Failures | 0/12 |

**Conclusion**: 7 nodes is the right balance for our use case.

---

## Future Optimization Ideas

If latency becomes a problem:
1. **Parallelize**: Run Guardrail + Intent Parser in parallel (save ~2s)
2. **Cache**: Store common query responses in Redis
3. **Cheaper Models**: Use GPT-3.5 for Reflector (simple yes/no decision)
4. **Streaming**: Stream responses as nodes complete

**When to Reconsider 7 Nodes**:
- If we add 5+ more tools → consider Tool Router node
- If queries become conversational → consider Dialogue Manager node
- If we need multi-agent coordination → reconsider architecture entirely

---

## References

- [7-Node Implementation](../../src/agent/graph.ts)
- [Node Definitions](../../src/agent/nodes/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
