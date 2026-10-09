# git-station — UI Wireframes v1

Low-fidelity screen specs for the TUI. Goal: fix layout and every visible state
**before** writing React/OpenTUI code. Nominal canvas: **80 x 24**, monospace.

Companion docs: `spec.md` (product), `architecture.md` (modules, store shape,
keybindings).

---

## 1. Layout regions

Every screen is built from the same vertical stack:

```
┌───────────────────────────────────────────┐
│ HEADER        (1 line, context + status)   │
├───────────────────────────────────────────┤
│                                            │
│ BODY          (flex, the screen's content) │
│                                            │
├───────────────────────────────────────────┤
│ BANNER        (optional, transient msg)    │
├───────────────────────────────────────────┤
│ FOOTER        (1-2 lines, keybinding hints)│
└───────────────────────────────────────────┘
```

- **HEADER** — app name + current context (list: repo count / watch state;
  detail: repo name, branch, sync, dirty).
- **BODY** — the list or the detail changes; centered empty/loading text when
  there is nothing to show.
- **BANNER** — only appears when there is a transient message or error. Absent by
  default (no reserved blank line).
- **FOOTER** — contextual keybinding legend for the current view.

**Overlays** (commit input, help) render centered on top of the active screen,
dimming the background.

---

## 2. Symbol legend

| Symbol | Meaning |
|---|---|
| `▸` | selection cursor (current row) |
| `●` | working tree dirty |
| `clean` | working tree clean |
| `↑n` / `↓n` | commits ahead / behind upstream |
| `◐` | an operation is running for that repo |
| `✗` | last operation failed for that repo |
| `·` | no upstream / detached HEAD marker (context) |

### Color intent (implementation detail, but fixed here)

| Element | Color intent |
|---|---|
| selected row | highlighted background |
| dirty `●` | yellow |
| `clean` | dim / grey |
| `↑n` | green |
| `↓n` | red |
| running `◐` | cyan |
| error `✗` + banner | red |
| header | bold |

---

## 3. Screen: List view

### 3.1 Normal

```
git-station                                          3 repos · watch on
──────────────────────────────────────────────────────────────────────────────
   NAME                 BRANCH             SYNC      WORKTREE
▸  api-server           main               ↑2 ↓0     ● 3 changed
   web-client           feature/ui         ↑0 ↓1     clean
   infra                main               ↑0 ↓0     ● 1 changed
──────────────────────────────────────────────────────────────────────────────
 j/k move   enter open   r refresh   ? help   q quit
```

### 3.2 Loading (initial scan / first status read)

Header shows the phase; rows appear as their status resolves.

```
git-station                                              scanning ~/dev…
──────────────────────────────────────────────────────────────────────────────
   NAME                 BRANCH             SYNC      WORKTREE
   api-server           reading status…
   web-client           reading status…
   infra                reading status…
──────────────────────────────────────────────────────────────────────────────
 q quit
```

### 3.3 Empty (no repos found)

```
git-station                                          0 repos · watch on
──────────────────────────────────────────────────────────────────────────────


                        No repositories found.

        Nothing with a .git directory under ~/dev.
        Check roots / ignore in ~/.config/git-station/config.toml


──────────────────────────────────────────────────────────────────────────────
 ? help   q quit
```

### 3.4 Row states (mix, same screen)

```
git-station                                          3 repos · watch on
──────────────────────────────────────────────────────────────────────────────
   NAME                 BRANCH             SYNC      WORKTREE
▸  api-server           main               ↑2 ↓0     ◐ pushing…
   web-client           feature/ui         ↑0 ↓1     clean
   infra                main               ↑0 ↓0     ✗ pull failed
──────────────────────────────────────────────────────────────────────────────
 j/k move   enter open   r refresh   ? help   q quit
```

- `◐ <verb>…` replaces the WORKTREE cell while an op runs for that repo.
- `✗ <verb> failed` replaces it after a failure; the full message shows in the
  detail view and/or the BANNER.

---

## 4. Screen: Detail view

### 4.1 Normal

```
git-station › api-server                              main · ↑2 ↓0 · ● dirty
──────────────────────────────────────────────────────────────────────────────
 STAGED (1)
   M    src/server.ts
 UNSTAGED (2)
   M    src/routes/user.ts
   ??   src/routes/health.ts
──────────────────────────────────────────────────────────────────────────────
 j/k change   space stage/unstage   a stage all   c commit
 f fetch   p pull   P push   r refresh   esc back
```

Grouping: STAGED first, then UNSTAGED (modified/tracked), then UNTRACKED.
Empty groups are omitted. Change rows show the porcelain `xy` code + path.

### 4.2 Operation running

The footer is replaced by a running line for the duration of the op.

```
git-station › api-server                              main · ↑2 ↓0 · ● dirty
──────────────────────────────────────────────────────────────────────────────
 STAGED (1)
   M    src/server.ts
 UNSTAGED (2)
   M    src/routes/user.ts
   ??   src/routes/health.ts
──────────────────────────────────────────────────────────────────────────────
 ◐ pushing to origin/main…
```

### 4.3 Error (BANNER visible)

```
git-station › api-server                              main · ↑2 ↓0 · ● dirty
──────────────────────────────────────────────────────────────────────────────
 ✗ push failed: rejected (non-fast-forward) — pull first
──────────────────────────────────────────────────────────────────────────────
 STAGED (1)
   M    src/server.ts
 UNSTAGED (2)
   M    src/routes/user.ts
   ??   src/routes/health.ts
──────────────────────────────────────────────────────────────────────────────
 j/k change   space stage/unstage   a stage all   c commit
 f fetch   p pull   P push   r refresh   esc back
```

### 4.4 Clean repo

```
git-station › infra                                        main · ↑0 ↓0 · clean
──────────────────────────────────────────────────────────────────────────────

                            Working tree clean.

──────────────────────────────────────────────────────────────────────────────
 f fetch   p pull   P push   r refresh   esc back
```

---

## 5. Overlay: Commit input

Single-line input (v1). Confirm commits the staged changes.

```
        ┌ Commit — api-server ──────────────────────────────────────┐
        │ feat: add health endpoint█                                │
        │                                                           │
        │ 2 staged · enter confirm · esc cancel                     │
        └───────────────────────────────────────────────────────────┘
```

- Title bar names the repo.
- Shows how many changes are staged; if none, show `nothing staged` and keep
  `enter` disabled with a visible hint.

---

## 6. Overlay: Help

```
        ┌ Help ─────────────────────────────────────────────────────────┐
        │ LIST                         DETAIL                           │
        │  j / k    move selection      j / k    move change            │
        │  enter    open repo           space    stage / unstage        │
        │  r        refresh             a        stage all              │
        │  ?        help                c        commit                 │
        │  q        quit                f        fetch                  │
        │                               p        pull                   │
        │                               P        push                   │
        │                               r        refresh                │
        │                               esc      back to list           │
        └───────────────────────────────────────────────────────────────┘
```

---

## 7. State matrix (what the UI must handle)

| Dimension | Values | Where it shows |
|---|---|---|
| screen | list, detail | HEADER BODY FOOTER swap |
| repo set | loading, empty, populated | BODY |
| per-repo status | unknown (`reading status…`), ready | row WORKTREE / SYNC |
| per-repo op | idle, running, error | row CELL, detail footer/banner |
| overlay | none, commit input, help | centered on top |
| global message | none, info, error | BANNER |

The implementation must render **every** combination without crashing: e.g. list
with no repos + a help overlay open, or detail view while a push fails.

---

## 8. Minimum size / overflow

- **Minimum usable width:** ~60 cols. Below that, truncate NAME/BRANCH with `…`
  before dropping SYNC/WORKTREE.
- **Narrow detail:** if the branch+sync string doesn't fit, keep branch and drop
  the sync counts.
- **Long lists:** vertical scroll; the selection stays visible. Show `↑/↓ more`
  affordance in the BODY edges when content is clipped.
- **Long change lists:** same vertical scroll; selection stays visible.
