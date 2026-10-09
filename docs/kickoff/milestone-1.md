# git-station — Milestone 1 Plan (Skeleton)

Executable work plan for the first milestone. The developer (you) writes the
code; this is the checklist and the acceptance criteria.

References: `spec.md` §10 (milestones), `architecture.md` §2.6 / §5 / §6,
`wireframes.md` (layouts and states).

---

## 1. Goal

Boot a real **OpenTUI React app** that renders the **List view** from **static
placeholder data**, with keyboard navigation, a working **Help overlay**, the
**empty/loading** states, and the **layout regions** (HEADER / BODY / BANNER /
FOOTER) already in place.

No git, no filesystem, no scanner, no watcher, no real store. It is an honest
walking skeleton: the shell is real, the data is fake.

## 2. Definition of done

- `bun run dev` launches the app and shows the List view (wireframe 3.1).
- `j`/`k` and arrow keys move the selection, clamped to bounds.
- `?` toggles the Help overlay (wireframe 6); it opens and closes cleanly.
- `q` (and Ctrl+C) quits and restores the terminal.
- The empty state (wireframe 3.3) and the loading state (3.2) are reachable by
  switching the fixture set.
- Every state in `wireframes.md` §7 that this milestone covers renders without
  crashing.
- `bun run typecheck`, `bun run lint` and `bun test` all pass.

## 3. Out of scope (later milestones — do NOT build here)

- Config loading, repo scanning, git service, watcher.
- Real store with actions/subscriptions (only **types** are defined here).
- Detail view, commit input, write operations.

## 4. Preconditions

- Toolchain pinned and working (`bun install` done).
- `tsconfig.json` already has `jsx: "react-jsx"` + `jsxImportSource: "@opentui/react"`.
- `src/index.ts` currently holds the `console.log("Hello via Bun!")` scaffold.

---

## 5. Bootstrap reference (OpenTUI React)

Entry point pattern (from the OpenTUI React docs):

```tsx
import { createCliRenderer } from "@opentui/core"
import { createRoot } from "@opentui/react"

function App() { /* ... */ }

const renderer = await createCliRenderer({ exitOnCtrlC: true })
createRoot(renderer).render(<App />)
```

- Key handling: `useKeyboard((key) => { ... })`; `useRenderer()` to reach the
  renderer (e.g. `renderer.destroy()` to quit).
- Layout: `<box>` (`flexDirection`, `border`, `title`, `padding`,
  `backgroundColor`, `style={{...}}`, `flexGrow`), `<text>` with `<span fg>`,
  `<strong>`, and `<scrollbox>` for scrolling.
- The renderer's `destroy()` is owned by whoever created it — quit by calling
  `renderer.destroy()`, not `process.exit()` in the middle of render.

---

## 6. Tasks (ordered)

Each task: **what**, **files**, **acceptance**.

### T1 — Run script + entry swap
- **What:** add a `dev` script and create the real entry.
- **Files:** `package.json` (`"dev": "bun run src/index.tsx"`), new
  `src/index.tsx`, remove `src/index.ts`.
- **Acceptance:** `bun run dev` shows a placeholder `<text>`; Ctrl+C exits cleanly;
  `bun run typecheck` passes (no `.tsx` JSX errors).

### T2 — App shell / layout regions
- **What:** the HEADER / BODY / BANNER / FOOTER stack (`wireframes.md` §1).
- **Files:** `src/ui/App.tsx`.
- **Acceptance:** at 80x24 the header line, a flex BODY, and the footer render in
  order; BANNER occupies no space when there is no message.

### T3 — Types + placeholder fixtures
- **What:** define the shared state types (so milestone 2 drops in) and a fixture
  set of 3 repos covering dirty / clean / ahead / behind.
- **Files:** `src/store/types.ts` (from `architecture.md` §2.5 — `RepoStatus`,
  `RepoState`, `AppState`), `src/store/fixtures.ts`.
- **Acceptance:** types compile under strict mode; fixtures typed and cover all
  three row shapes in `wireframes.md` §3.1.

### T4 — Formatting helpers
- **What:** pure functions for the row cells and truncation.
- **Files:** `src/ui/format.ts`: `formatSync(ahead, behind)`, `formatWorktree(...)`,
  `truncate(text, width)`.
- **Acceptance:** `formatSync(2,0) -> "↑2 ↓0"`; `formatSync(0,1) -> "↑0 ↓1"`;
  `formatWorktree` returns `● n changed` / `clean`; `truncate` adds `…` at width.

### T5 — RepoList + RepoRow
- **What:** render the list from fixtures using the symbol legend and color
  intent (`wireframes.md` §2, §3.1).
- **Files:** `src/ui/RepoList.tsx`, `src/ui/RepoRow.tsx`.
- **Acceptance:** output matches wireframe 3.1; selection cursor `▸` on the
  current row; colors per the intent table.

### T6 — Selection + keymap
- **What:** centralized keymap + `useKeyboard` wiring in `App`. `j`/`↓` next,
  `k`/`↑` prev (clamped), `?` toggle help, `q` quit. `enter`/`r` are stubs.
- **Files:** `src/ui/keymap.ts` (key map + `nextIndex(current, count, delta)`),
  wiring in `src/ui/App.tsx`.
- **Acceptance:** selection moves and never goes out of bounds; `?` toggles;
  `q` destroys the renderer.

### T7 — Help overlay
- **What:** centered overlay listing list/detail keybindings.
- **Files:** `src/ui/Help.tsx`.
- **Acceptance:** matches wireframe 6; opens over both the populated and empty
  list without crashing; `?`/`esc` closes it.

### T8 — Empty + loading states
- **What:** the two non-populated list states.
- **Files:** touched in `src/ui/RepoList.tsx` / `App.tsx`.
- **Acceptance:** empty fixture set renders wireframe 3.3 (with the config hint);
  a `loading` flag renders wireframe 3.2 (`scanning …` / `reading status…`).

### T9 — StatusBar + BANNER
- **What:** footer hints (contextual per view) and the optional message line.
- **Files:** `src/ui/StatusBar.tsx`.
- **Acceptance:** hints match `wireframes.md` §3/§4 footers; setting a message
  shows the banner, clearing it hides the line.

---

## 7. Minimum tests (`bun test`)

Pure logic only — rendering the CLI is not unit-tested in v1.

- `format.ts`: `formatSync`, `formatWorktree`, `truncate` (edge cases: 0/0,
  width < text, exact width).
- `keymap.ts`: `nextIndex` clamps at both ends and handles an empty list
  (`count === 0`).

## 8. Manual verification checklist

- [ ] `bun run dev` boots; header/footer visible.
- [ ] `j`/`k` and arrows move the cursor; it stops at first/last row.
- [ ] `?` opens help; `?`/`esc` closes it.
- [ ] `q` quits and the terminal is restored (no leftover raw mode).
- [ ] Swap fixtures to empty → wireframe 3.3 shows.
- [ ] Set `loading` → wireframe 3.2 shows.
- [ ] Resize the terminal narrow (~60 cols): NAME/BRANCH truncate, layout holds.
- [ ] `bun run typecheck`, `bun run lint`, `bun test` green.

## 9. What this unlocks

Milestone 2 replaces `fixtures.ts` with scanner + real `getStatus` and introduces
the store actions. Because the components already take data via props and the
types live in `store/types.ts`, that swap is localized: no rewrite of the UI
primitives built here.
