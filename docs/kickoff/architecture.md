# git-station — Architecture v1

Blueprint that turns `spec.md` into technical shape. Nothing here is product code
yet; it defines modules, boundaries, state and data flow.

Stack: **Bun + TypeScript (strict) + `@opentui/react`** (React 19).

---

## 1. Layering

The app is a one-way pipeline: **config → scanner → store → ui**, with the
**watcher** and the **git service** feeding the store. Nothing in `ui` talks to
git or the filesystem directly; it reads and writes the store, which owns the
orchestration.

```
                 ┌──────────┐
   ~/.config ──▶ │  config  │
                 └────┬─────┘
                      ▼
                 ┌──────────┐        ┌───────────┐
   filesystem ──▶│ scanner  │───────▶│   store   │◀── watcher (fs events)
                 └──────────┘        │  (state)  │
                                     └─────┬─────┘
                                           │  (actions)
                                     ┌─────▼─────┐
                                     │ git svc   │──▶ git binary (subprocess)
                                     └───────────┘
                                           ▲
                                     ┌─────┴─────┐
                                     │    ui     │  (OpenTUI React)
                                     └───────────┘
```

Rule: **`ui` is pure.** Given store state it renders; user input dispatches
actions. No side effects, no `spawn`, no `fs`.

---

## 2. Modules

### 2.1 `config`
- **Does:** load `~/.config/git-station/config.toml`, validate, return typed
  `Config { roots: string[]; ignore: string[] }`.
- **Does NOT:** discover repos or touch git.
- **Defaults:** if the file is missing, `roots = [process.cwd()]`, `ignore = []`
  plus built-in ignores (`node_modules`, `.git`, etc.).
- **Parsing:** TOML parser (`bun` can read the file; use a small TOML lib or
  Bun's built-in if available). Decide the concrete lib at implementation time.

### 2.2 `scanner`
- **Does:** `discoverRepos(roots, ignore): Promise<RepoRef[]>` — walks each root
  fully, detects `.git` (directory **or** file, to cover worktrees/submodules),
  returns absolute paths.
- **Rules:** stop descending into a directory the moment a `.git` is found; skip
  ignored directories; do not follow symlinks.
- **Does NOT:** read git state. It only locates repos.
- **Perf note:** full walk is fine for v1; if a root is huge, this is the piece to
  revisit first.

### 2.3 `git` service (adapter over the binary)
Single place that runs subprocesses. Everything else calls these functions.

```ts
// src/git/run.ts
runGit(repoPath: string, args: string[], opts?: { signal?: AbortSignal }):
  Promise<{ stdout: string; stderr: string; code: number }>
```

```ts
// src/git/status.ts
getStatus(repoPath: string): Promise<RepoStatus>
// parses `git status --porcelain=v2 --branch`
```

```ts
// src/git/ops.ts
fetch(repoPath: string): Promise<OpResult>
pull(repoPath: string): Promise<OpResult>
push(repoPath: string): Promise<OpResult>          // adds -u origin <branch> if no upstream
stage(repoPath: string, paths: string[]): Promise<OpResult>
commit(repoPath: string, message: string): Promise<OpResult>
```

```ts
// src/git/types.ts
type RepoStatus = {
  branch: string | null;      // null => detached HEAD
  upstream: string | null;
  ahead: number;
  behind: number;
  dirty: boolean;
  changes: Change[];
};
type Change = { xy: string; path: string; staged: boolean };
type OpResult = { ok: boolean; stderr?: string };
```

- **Does NOT:** hold state, know about the UI, or decide what a "repo" is.
- **Rules:** always `runGit` with `cwd = repoPath`; never block; surface failures
  as `OpResult`/thrown errors, not process exits.

### 2.4 `watcher`
- **Does:** `watchRepo(repoPath, onEvent)` on `<repo>/.git` (recursive where the
  platform allows), and `watchRoots(roots, onEvent)` to detect added/removed
  repos.
- **Mechanism:** native `fs.watch`, debounced (see `lib/debounce`). Fallback to
  `@parcel/watcher` only if the native spike fails — isolate the choice behind
  this module so swapping is a one-file change.
- **Emits:** a coarse "this repo changed" signal, not fine-grained FS events. The
  store responds by re-reading status (never by trusting the event detail).

### 2.5 `store`
- **Does:** owns all app state and orchestrates actions (call git, watch,
  refresh). Single source of truth for the UI.
- **State shape (draft):**

```ts
type AppState = {
  repos: Map<string, RepoState>;   // keyed by absolute path
  order: string[];                 // stable render order
  selected: string | null;
  view: 'list' | 'detail';
  commitInputOpen: boolean;
  message: string | null;          // transient status/error banner
};

type RepoState = {
  ref: RepoRef;                    // path, name
  status: RepoStatus | null;       // null until first read
  op: { kind: OpKind; state: 'idle' | 'running' | 'error'; error?: string };
};
```

- **Implementation:** a small custom store (subscribe/getSnapshot) or React
  context + `useReducer`. No external state lib in v1.
- **Actions:** `refreshAll`, `refreshOne(path)`, `fetch/pull/push/stage/commit`,
  `select(path)`, `openDetail/closeDetail`, `openCommitInput/closeCommitInput`.

### 2.6 `ui` (OpenTUI React)
- **Does:** render from store state; translate key events into actions.
- **Components:**

| Component | Responsibility |
|---|---|
| `App` | bootstrap, subscribe to store, top-level layout |
| `RepoList` | scrollable list of repos |
| `RepoRow` | name, branch, dirty marker, ahead/behind, op spinner/error |
| `RepoDetail` | working-tree changes + action hints |
| `CommitInput` | single-line commit message |
| `StatusBar` | global message / keybinding legend |
| `Help` | full keybinding map (`?`) |

- **Does NOT:** run git, read config, or watch files.

---

## 3. Data flow

### Bootstrap
1. `config.load()`.
2. `scanner.discoverRepos()` → seed `store.repos`.
3. Start `watchRoots` + `watchRepo` per repo.
4. Kick off `refreshOne` for each repo (status reads run in parallel, bounded).

### Change on disk
`watcher` event (debounced) → `store.refreshOne(path)` → `git.getStatus(path)` →
update `RepoState.status` → subscribe → re-render.

### User action (e.g. push)
1. Guard: if `RepoState.op.state === 'running'`, ignore the new action.
2. Set `op = { kind: 'push', state: 'running' }`.
3. `await git.push(path)`.
4. On success: `refreshOne(path)`, `op.state = 'idle'`.
5. On failure: `op.state = 'error'` + `error` from stderr; also set a transient
   banner message.

---

## 4. Concurrency and error handling

- **One in-flight write op per repo.** Different repos run in parallel.
- **Status reads** can run concurrently but are bounded (don't spawn hundreds at
  once); a small concurrency limit (e.g. 8) is enough for v1.
- **Never block the UI:** every git call is async; the render path only reads
  current state.
- **Timeouts:** long ops (fetch/pull over network) get a generous timeout and can
  be surfaced as still-running rather than silently hanging.
- **Errors are per-repo and non-fatal:** show inline on the repo + a banner;
  never crash the process. A git failure is data, not an exception to the user.

---

## 5. Proposed folder structure

```
src/
  index.tsx            # entry: wire config → scanner → store → <App/>
  config/
    load.ts
    schema.ts
  scanner/
    discover.ts
  git/
    run.ts
    status.ts
    ops.ts
    types.ts
  watcher/
    watch.ts
  store/
    store.ts
    actions.ts
    types.ts
  ui/
    App.tsx
    RepoList.tsx
    RepoRow.tsx
    RepoDetail.tsx
    CommitInput.tsx
    StatusBar.tsx
    Help.tsx
    keymap.ts
  lib/
    debounce.ts
    concurrency.ts
```

---

## 6. Keybinding map (draft for v1)

### List view
| Key | Action |
|---|---|
| `j` / `↓` | next repo |
| `k` / `↑` | previous repo |
| `Enter` / `l` | open detail |
| `r` | refresh selected |
| `?` | help |
| `q` | quit |

### Detail view
| Key | Action |
|---|---|
| `Esc` / `h` | back to list |
| `j` / `k` | next / previous change |
| `space` | stage / unstage selected change |
| `a` | stage all |
| `c` | open commit input |
| `f` | fetch |
| `p` | pull |
| `P` | push |
| `r` | refresh |

### Commit input
| Key | Action |
|---|---|
| `Enter` | confirm commit |
| `Esc` | cancel |

---

## 7. Testing strategy

- **git service:** unit tests against throwaway temp repos created with the git
  binary (`git init`, commits) — verifies status parsing and each op. This is the
  highest-value test surface.
- **scanner:** temp dir tree with nested/ignored/`.git`-file cases.
- **store:** action/reducer tests with a fake git service (no real subprocess).
- **ui:** light — render the list from a fixed state; key → action dispatch.
- Run with `bun test`.

---

## 8. Milestone mapping

| Spec milestone | Architecture work |
|---|---|
| 1. Skeleton | `ui/App` + `RepoList` with placeholder data + keymap wiring |
| 2. Discovery + read | `config`, `scanner`, `git.run/status`, `store` seed + refresh |
| 3. Watch | `watcher` + debounce + refresh-on-event |
| 4. Detail | `RepoDetail` + change parsing from `RepoStatus` |
| 5. Write ops | `git.ops` + action guard/op-state + inline feedback |
| 6. Polish | `Help`, error states, config `ignore`/`roots` handling |

---

## 9. Open technical questions (implementation-time, not blocking design)

- Exact TOML parser (Bun built-in vs. small dep).
- Native `fs.watch` reliability on Linux/macOS — resolved by the milestone-3 spike.
- Concurrency limit for parallel status reads.
- Whether `push` on a detached HEAD should be blocked with a clear message (yes,
  likely).
