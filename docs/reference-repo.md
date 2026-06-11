# Reference Repositories

## Game prototype (read-only)

**Path:** `/Users/paolocargnin/Sites/VibeCoding/imbustai-01-game`

### Key files

| File | Why |
|------|-----|
| `src/config/systemPrompt.ts` | Voss story content to decompose into DB seed |
| `src/services/GameEngine/gameFlow.ts` | Turn orchestration |
| `src/services/GameEngine/aiResponseParser.ts` | JSON → letters (fix time bug) |
| `src/services/GameEngine/timeSimulator.ts` | Replace with editor-driven TimeService |
| `src/services/AIService/contextManager.ts` | Context building (replace monolithic approach) |
| `src/services/AIService/strategies/FullContextStrategy.ts` | Anti-pattern reference |
| `src/types/aiResponseSchema.ts` | Structured output schema |
| `src/types/game.ts` | GameState, Letter, NPC types |
| `src/store/gameStore.ts` | State management patterns |
| `src/components/LetterComposer/` | Player compose UI |
| `src/components/LetterInbox/` | Inbox UI |
| `src/components/SendAllButton/` | Multi-letter send flow |
| `src/test/e2e/gameWorkflow.test.ts` | E2E to port |
| `MANUAL_TESTING_LETTERS.md` | Manual test scripts |

## tryout-01 (read-only — do not edit)

**Path:** `apps/tryout-01`

| File | Why |
|------|-----|
| `app/api/game/reply/route.ts` | API shape, conversation history |
| `components/game-view.tsx` | Delayed `visible_from` UX |
| `components/letter-compose.tsx` | Compose UX |
| `app/admin/game/[id]/page.tsx` | Admin game view |

## Website (implementation target)

**Path:** `apps/website`

| File | Why |
|------|-----|
| `supabase/migrations/` (monorepo root) | Current schema |
| `lib/types/db.ts` | TypeScript row types |
| `app/api/admin/orders/[orderId]/start-game/route.ts` | Game creation |
| `app/admin/game/[gameId]/page.tsx` | Extend for reply workflow |
| `app/game/[gameId]/page.tsx` | Extend for play mode |
| `components/games/admin-game-detail-client.tsx` | Admin UI base |