# Data Ownership

| Data domain | Owning module | Notes |
|---|---|---|
| Conversation turn history | `packages/ai` MemoryManager | No other module writes conversation history directly. |
| Derived mastery / progress aggregates | `packages/analytics` | Reads from Mastery/Assessment repositories; never writes raw conversation data. |
| Mastery state (per-topic) | `packages/ai` MasteryEngine (write) / `packages/analytics` (read/aggregate) | Single writer, multiple readers. |
| Curriculum position | `packages/curriculum` | Source of truth for topic/lesson sequencing. |
