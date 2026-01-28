# 1. Use LangGraph for Agent Orchestration

Date: 2026-01-28

## Status

Accepted

## Context

We needed a framework for building a stateful AI agent that could:
- Maintain conversation context across multiple turns
- Execute complex multi-step workflows (plan → execute → reflect)
- Provide visibility into agent decision-making
- Avoid infinite loops and uncontrolled behavior

Options considered:
1. **Raw LangChain chains** - Simple but limited for multi-step agentic workflows
2. **LangGraph** - Explicit graph-based orchestration
3. **Google ADK** - Managed service with event-driven runtime
4. **Custom loop implementation** - Full control but hard to debug

## Decision

We chose **LangGraph** for our agent implementation.

## Rationale

### Pros
- **Explicit Control Flow**: Every node and edge is visible, making debugging easier
- **State Management**: Custom reducers give fine-grained control over state merging
- **No Vendor Lock-in**: Can run anywhere (not tied to Google Cloud)
- **Model Flexibility**: Works with any LLM (OpenAI, Anthropic, local models)
- **Production-Ready**: Used by companies like Uber and LinkedIn

### Cons
- **Learning Curve**: Steeper than simple chains, need to understand graph concepts
- **DIY Production Tooling**: Have to integrate monitoring (LangSmith), evals, etc. ourselves
- **More Code**: Requires explicit node and edge definitions

## Consequences

### Positive
- We can **see exactly** what the agent is doing at each step (thought process UI)
- **Preventing infinite loops** is straightforward with max iterations on reflector node
- **State persistence** with MySQL checkpointer works reliably
- **Testing** is easier - each node can be unit tested independently

### Negative
- Had to spend time learning LangGraph concepts (graphs, reducers, checkpoints)
- Need to manually set up monitoring and observability (not built-in like Google ADK)
- More upfront code compared to simple LangChain chains

### Trade-offs Accepted
- We accept the DIY overhead for production tooling in exchange for **full control and transparency**
- We accept the steeper learning curve because it forces us to understand agent fundamentals
- We accept more code because it makes the agent behavior **explicit and debuggable**

## Comparison with Google ADK

| Aspect | LangGraph (Our Choice) | Google ADK |
|--------|------------------------|------------|
| Control Flow | Explicit graphs | Event-driven (abstracted) |
| Learning Curve | Steep | Moderate |
| Vendor Lock-in | None | Google Cloud |
| Production Tools | DIY | Built-in |
| Transparency | Full visibility | More magical |

For our use case (learning and transparency), LangGraph was the better fit.

## References

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Framework Comparison](../langgraph-vs-google-adk.md)
- [Implementation](../../src/agent/graph.ts)
