# 2. Store Prompts as YAML Files

Date: 2026-01-28

## Status

Accepted

## Context

LLM prompts are critical to agent behavior. We needed a way to:
- Version control prompt changes
- Allow non-engineers to edit prompts
- A/B test different prompt variations
- Keep prompts separate from code logic

Options considered:
1. **Hardcode in TypeScript** - Simple but hard to iterate
2. **JSON files** - Better but less readable
3. **YAML files** - Human-readable, easy to edit
4. **Database** - Over-engineered for our use case

## Decision

We store all prompts as **YAML files** using the **COSTAR framework**.

## Rationale

### YAML Format
- **Human-readable**: Plain text, easy to review in Git diffs
- **Version controlled**: Every prompt change tracked in Git history
- **Non-engineer friendly**: Product managers can propose prompt changes via PRs

### COSTAR Framework
Each prompt file follows this structure:
```yaml
template: |
  # CONTEXT
  You are a STRICT Guardrail for a Knowledge Ownership Agent.
  
  # OBJECTIVE
  Block any query outside software engineering topics.
  
  # STYLE
  Strict, binary decision-making.
  
  # TONE
  Authoritative but invisible.
  
  # AUDIENCE
  Internal system router.
  
  # RESPONSE FORMAT
  JSON: {"allowed": boolean, "reason": string}
```

This ensures prompts are **consistent and structured**.

## Consequences

### Positive
- ✅ **Easy iteration**: Change prompts without touching code
- ✅ **Git history**: See how prompts evolved (`git log prompts/guardrail.yaml`)
- ✅ **A/B testing**: Swap YAML files to test variations
- ✅ **Collaboration**: Non-engineers can contribute prompt improvements

### Negative
- ❌ **File I/O overhead**: Loading YAML files on every node execution
- ❌ **Runtime errors**: Typos in YAML only caught at runtime (not compile-time)

### Mitigations
- Cache loaded prompts in memory (future optimization)
- Add YAML schema validation on startup
- Use TypeScript types for prompt variables

## Example

**File**: `src/agent/prompts/guardrail.yaml`

```yaml
template: |
  # CONTEXT
  You are a STRICT Guardrail...
  
  # INPUT
  Query: "${userQuery}"
  Conversation History: ${conversationHistory}
```

**Usage**: `src/agent/nodes/guardrail.ts`

```typescript
const prompt = await loadPrompt("guardrail.yaml", {
  userQuery: state.messages[state.messages.length - 1].content,
  conversationHistory: formatHistory(state.messages)
});
```

## References

- [Prompt Files](../../src/agent/prompts/)
- [COSTAR Framework](https://medium.com/@pankaj_pandey/costar-framework-for-llm-prompts-a-proven-recipe-for-better-results-38bb470d45e1)
