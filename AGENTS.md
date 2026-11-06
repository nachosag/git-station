# AGENTS.md

git-station (`gs`): a keyboard-driven TUI (bun + TypeScript + @opentui/react) to discover, monitor, and manage every local git repository from one place. v1 is specified in `docs/v1/SPECS.md`. Application code arrives story by story — the current state lives in the Status table of `docs/v1/BACKLOG.md`.

## Working contract — read before doing anything

- The user writes all the code himself. The default role here is tutor: answer doubts, explain concepts, suggest approaches. Never write, edit, or refactor his code unless he explicitly delegates a task.
- Before code exists for a feature, do not prescribe internal names — no file, function, class, or type names. Describe outcomes and constraints; internal design emerges from his code.
- Once his code exists, proactively recommending better names, refactors, and simplifications is welcome — as proposals with reasons, never as edits.
- "revisá mi código" is the formal review trigger.
- Sessions run on the backlog loop: "qué hay que hacer hoy" → the current story in `docs/v1/BACKLOG.md` → "¿por dónde arranco?" → an outcome-level first step, never a file/module order.

## Source of truth

- `docs/v1/SPECS.md` — v1 scope, behavior, external contracts (git commands, config format, keyboard map), and non-goals. Read it before proposing anything; do not expand scope beyond it.
- `docs/v1/BACKLOG.md` — the single progress tracker: a Status table per story plus checkbox acceptance criteria. Tick a criterion only when it has been verified (run the app, run the tests, or check from another terminal), never when code is merely written. Move stories to In progress / Done accordingly. `SPECS.md` stays spec-only.

## Commands

- bun 1.4.2 is the runtime, package manager, and test runner, pinned via `mise.toml`. This project deliberately uses bun — never pnpm, npm, or yarn.
- `bun install` — dependencies
- `bun run src/index.ts` — run the app
- `bun run typecheck` · `bun run lint` · `bun run fmt:check` — the verification trio; all three must pass before a story is Done
- `bun test` — tests (`bun:test`, colocated `*.test.ts`)
- No CI and no pre-commit hooks; the trio above is the gate.

## Toolchain quirks

- `bunfig.toml` sets `[install] exact = true`: every `bun add` pins an exact version. That is policy, not accident — keep it.
- `@opentui/core` and `@opentui/react` are pinned at exact 0.5.17 because the API is young and churns. Do not upgrade casually and do not suggest `^` ranges.
- opentui is not react-dom. Bootstrap is `await createCliRenderer(...)` from `@opentui/core` plus `createRoot(renderer).render(<App />)` from `@opentui/react`; whoever creates the renderer owns `renderer.destroy()` on every exit path, or the user's terminal breaks.
- Keyboard input is the `useKeyboard` hook, and key names are not what you would guess (Enter arrives as `return`). To discover names, log the KeyEvent to a file — `console.log` corrupts the render.
- opentui ships test utilities: `createTestRenderer` + mock keys in `@opentui/core/testing`, and `testRender` in `@opentui/react`.
- Tests are designed per story as the backlog advances, not pre-cataloged. Logic that wraps git is tested against real git in temp dirs — a local bare repo can act as `origin`, so fetch/pull/push test without network.

## Known traps

- `gs` collides with ghostscript (`/usr/bin/gs`) on this machine. The binary-name decision is pending: do not run a global install (`bun i -g`) that would shadow it.
