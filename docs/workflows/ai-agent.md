---
title: AI agent & tool calling workflow
description: How an AI-native React Native app works — features expose typed tools backed by use cases, a vendor-neutral LLM client talks to your backend proxy, and an agent loop executes tool calls with zod validation and human-in-the-loop confirmation.
---

# AI agent loop

**Source**: [`packages/ai/src`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/packages/ai/src), example [`features/assistant`](https://github.com/llRizvanll/Mobile-Apps-Framework/tree/main/apps/example/src/features/assistant), tools in [`features/todos/ai/tools.ts`](https://github.com/llRizvanll/Mobile-Apps-Framework/blob/main/apps/example/src/features/todos/ai/tools.ts)

## Architecture

```mermaid
flowchart LR
  subgraph Device
    UI[Assistant screen<br/>MviStore] --> AG[runAgent]
    AG <--> REG[ToolRegistry]
    REG --> T1[todos.list] & T2[todos.add ⚠️]
    T1 & T2 --> UC[Use cases<br/>same as the UI]
    AG --> CL[AIClient port<br/>+ withObservability]
  end
  CL -- ChatRequest + tool specs --> BE[Your backend<br/>keys · quotas · safety · tier→model]
  BE --> LLM[(Any LLM vendor)]
```

The app never holds vendor API keys. It sends **logical model tiers** (`fast` / `balanced` / `smart`), and the backend maps them to real models.

## One conversation turn

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant S as MviStore
  participant A as runAgent
  participant C as AIClient
  participant T as Tool (todos.add)
  U->>S: intent send("add buy milk")
  S->>A: messages + tool specs
  A->>C: complete()
  C-->>A: stopReason=tool_use, call todos.add {title}
  A->>A: parser.parse(input) (zod)
  A->>U: confirm? (requiresConfirmation)
  U-->>A: Allow
  A->>T: execute({ title })
  T-->>A: { id, title }
  A->>C: complete() with tool_result
  C-->>A: "Done — added buy milk"
  A-->>S: intent replied → new bubble
```

## Safety rails

| Rail                                                                            | Where                                                       |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Tools call **use cases**, never HTTP or storage directly                        | convention, checked in review (`AGENTS.md` invariant 8)     |
| Model input is validated with zod before execution                              | `AITool.parser`                                             |
| Side effects need user confirmation                                             | `requiresConfirmation: true` → `confirm` callback           |
| Tool failures go back to the model as `isError` results (the model can recover) | `runAgent`                                                  |
| Runaway loops are stopped                                                       | `maxSteps` (default 8)                                      |
| No prompt or response content in logs                                           | `withObservability` logs sizes, tiers, latency, tokens only |
| Cancel on unmount                                                               | `AbortSignal` from the MVI store                            |

## Testing without a model

```ts
const client = new ScriptedAIClient([
  toolUseResponse('c1', 'todos.add', { title: 'Buy milk' }),
  textResponse('Added!'),
]);
```

The example app also ships a rule-based fake backend (`bootstrap/mockBackend.ts`), so the whole loop runs offline.
