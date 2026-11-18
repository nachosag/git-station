# git-station v1 Specification

git-station (`gs`) is a keyboard-driven terminal UI to discover, monitor, and manage every local git repository on the machine from one place. Unlike read-only dashboards (manygit, gitpane, gitdeck), v1 lets the user run the everyday write operations — stage, commit, fetch, pull, push — without leaving the TUI or changing directories. This document is the single source of truth for v1 scope and behavior.

## Core decisions

| #   | Area         | Decision                                                                                                                                                                                 |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Discovery    | Hybrid: walk `$HOME` pruning heavy directories + optional config for extra roots and ignores. No cache in v1 (scan on open).                                                             |
| D2  | Layout       | Stacked full-screen views: the list is the home screen; `Enter` opens the detail view; `Esc` goes back. No split panes.                                                                  |
| D3  | Detail scope | Header + file list (staged/unstaged/untracked) + one-line commit + fetch/pull/push. No diff or branch checkout in v1; the commit graph is its own page, opened from the detail with `g` (US-013, added 2026-11-17). |
| D4  | Network      | The list always shows local state (`git status`). Opening a detail view triggers a background `fetch` (with indicator) followed by a re-status. No fetch-all, no other implicit network. |
| D5  | Git adapter  | Always shell out to the `git` binary via `Bun.spawn` with `git -C <path>`. No git library. `git status --porcelain=v2 --branch` is the single source of repo state.                      |
| D6  | UI language  | All on-screen text is English in v1 (decision 2026-11-11). A localized UI (Spanish first) is a v2 candidate.                                                                             |

| D7 | Theme | Colors and shared styles come from one theme file of tokens; screens never hardcode them. The styling standard and each page's design live in §Design (D7) (expanded 2026-11-17). |

## Goals (v1)

- Show every detected repository with: name, current branch, dirty indicator, ahead/behind counts vs upstream.
- Open a detail view for any repository.
- Run fetch, pull, stage, commit, and push from the TUI without `cd`-ing or leaving `gs`.
- Delete a repository from the list — regular repos, umbrella repos (with every nested repo), and worktrees — behind a typed-name confirmation.
- Clean, keyboard-driven design: one list, one detail view.

## Non-goals (v1)

Interactive rebase, stash management, submodules, pull requests / platform integrations (GitHub, GitLab), remote or network-hosted repos, merge conflict resolution UI, applying one action to many repos at once (including fetch-all), localized UI (English-only in v1; Spanish is a v2 candidate).

## Stack

| Tool                           | Version                 | Role                            |
| ------------------------------ | ----------------------- | ------------------------------- |
| Bun                            | 1.4.2                   | Runtime, test runner, installer |
| TypeScript                     | 7.0.2 (strict)          | Language                        |
| @opentui/core + @opentui/react | 0.5.17 (pinned, no `^`) | TUI rendering, keyboard, input  |
| React                          | 19.3.0                  | Component model                 |
| oxlint / oxfmt                 | 1.87.0 / 0.72.0         | Lint and format                 |

## Structure

Internal module layout, file names, and types are not prescribed; they emerge from the code. One constraint: state management stays with React — no store library in v1.

## Git command map

| Operation                   | Command                                                                            |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Status (single call)        | `git -C <path> status --porcelain=v2 --branch`                                     |
| Stage files / all           | `git -C <path> add -- <paths>` / `git -C <path> add -A`                            |
| Unstage tracked             | `git -C <path> restore --staged -- <paths>`                                        |
| Unstage untracked           | `git -C <path> rm --cached -- <paths>`                                             |
| Commit                      | `git -C <path> commit -m <message>`                                                |
| Fetch                       | `git -C <path> fetch`                                                              |
| Pull                        | `git -C <path> pull`                                                               |
| Push                        | `git -C <path> push`                                                               |
| Delete repository (regular) | Recursive filesystem delete of the repo directory — no git command exists for this |
| Delete worktree             | `git worktree remove --force <path>`                                               |

Rationale for shelling out: zero new dependencies, and `push`/`pull` reuse the user's existing SSH agent and credential helpers — git-station never handles auth.

## Discovery (D1)

Algorithm on every launch:

1. Read `~/.config/git-station/config.json` if present. A missing file means defaults; it is never an error.
2. Recursively walk `$HOME` plus every root from config, skipping any directory whose name is in the prune list or matches config `ignores`. Repositories are reported at any depth: the walk descends into a repository found inside another one, so nested loose clones are their own rows (e.g. a sandbox repo gitignored by its parent).
3. A directory containing a `.git` entry — a directory or a file (worktrees) — is a repository.
4. While the scan runs, show a bare centered `found: N` counter — no progress bar (redesigned 2026-11-17; the look is designed in §Design, list page). The counter covers the whole scan: the walk plus every repository's status read, since the list renders once, complete, at the end. Decisions: the list never fills incrementally (2026-11-11); the loading screen stays until the last status arrives (2026-11-14).

Default prune list: `.git` (git's internal storage, never a repository), `node_modules`, `.cache`, `.npm`, `.bun`, `.venv`, `venv`, `.cargo`, `.rustup`, `.m2`, `.gradle`, `.local`, `target`, `dist`, `build`, `Library`, `AppData`.

Config format:

```json
{
  "roots": ["/opt/src"],
  "ignores": ["playground", "/home/user/archive"]
}
```

- `roots`: extra absolute roots to scan in addition to `$HOME`.
- `ignores`: directory names (matched anywhere in the walk) or absolute paths to skip.

Known ceiling: scanning on every open costs seconds on a large `$HOME`. Persisting the last scan to a state file (render it instantly on open, rescan in the background) is deliberately NOT a v1 upgrade path — stale data would need validation, and that complexity is deferred to v2. Decision (2026-11-11).

## Views

### List view (home screen)

One row per repository:

```
name                 branch           ●    ↑2 ↓0
```

- `name`: repository directory name.
- `branch`: current branch, or `detached` on detached HEAD.
- `●`: dirty indicator — present when the index or working tree has changes, empty when clean.
- `↑N ↓M`: ahead/behind vs upstream; `—` when there is no upstream.

States: scanning (progress indicator while the walk runs; its look is designed in §Design, list page), empty (no repositories found, with a hint), filtered (`?` activates search mode on the band input; the active query stays visible in the band — a filtered list is never silent). While search mode is active the keyboard belongs to the input: no row movement, `Enter` confirms the filter and exits the mode keeping the query, `Esc` cancels — clears the query and exits the mode.

### Detail view

Sections, top to bottom (the look is designed in §Design, detail page):

1. Header: absolute path, branch, upstream, ahead/behind, dirty counts (staged / unstaged / untracked).
2. Files: three groups — staged, unstaged, untracked. One row per file; renames display `old -> new`.
3. Commit input: hidden until `c` is pressed; one-line input, `Enter` commits, `Esc` cancels.
4. Feedback line: the running operation (`fetch…`, `push…`), its output, or the last error's stderr.

Opening the detail view renders the local status immediately; a background `fetch` runs (D4) and a re-status refreshes ahead/behind when it completes.

### Graph view

Opens from the detail view with `g` and returns with `esc`. Shows the repository's commit graph — its design dialogue is the next one to happen; this section grows when that lands.

## Design (D7)

The design is defined in full, page by page (expanded 2026-11-17): which components each page shows and in what order, sizes and spacing, and the look of every element — plus colors and visual details. Each page's design is written here before its implementation step; the list page and the detail page get one subsection each.

### Styling standard (2026-11-17)

- Tokens are semantic: named for the role they play (`selection`, `muted`, `warning`), never for their color value. A token is added only when a component needs it.
- One theme file (`theme.ts`) holds the tokens and nothing else. Every component reads its colors from it; no screen or component hardcodes a color.
- Direct props always (`bg`, `fg`, …); the `style` prop only when no direct prop covers the need.
- Palette (2026-11-17): the official Tokyo Night values, taken from the theme's own site. `surface` `#1a1b26` · `border` `#3b4261` · `separator` `#282c3f` · `selection` `#2f334d` · `muted` `#565f89` · `attention` `#ff9e64` (the official orange, chosen over the yellow `#e0af68` the same day) · `warning` `#f7768e`. `border`, `separator` and `selection` are not published by the theme; they stay as they were until a page needs a different one.

### List page (2026-11-17)

Chosen in dialogue and prototyped with live-server (2026-11-17, before prototypes were kept in-repo — proto 9 is no longer on disk). A full redesign was chosen over keeping the structure (2026-11-17).

- **Panel**: centered on screen, does not span the full width, thin border with sharp corners, surface background; nothing is written on the border line.
- **Layout, top to bottom**: search band, table header, scrollable list, hints line.
- **Search band** (revised 2026-11-17, protos 10–11): one row tall, exactly matching the data rows' height. An always-visible input sits on the left, placeholder `search` in the muted color; the typed query renders in the attention color. `?` activates search mode (the same app-wide behavior as the action panel's search): `cancel: esc` appears on the band's right while the mode is active or a query remains; `enter` confirms the filter and leaves the field keeping the query; `esc` cancels — clears the query and exits the mode. No app title is shown — the `git-station` title was tried in the band and dropped the same day.
- **Table**: three visual columns, header and cells centered alike — `id` (the repository's stable index in the full scan, muted, never colored), `repo / branch` (one cell: the name in the text color, ` / branch` muted), and `dirty / ahead / behind` (one column on the right: `✱ / ↑N / ↓M` in the attention color; a missing segment keeps its dash — `✱ / — / —`, `— / ↑1 / —`; a fully idle repository shows an empty cell).
- **Dirty mark** — reversed 2026-11-17: it had been removed from the list as redundant, then brought back the same day as the `✱` segment of the merged column.
- **Rows**: faint horizontal separators only (never vertical), extra line spacing between rows, selection shown as a background; the list scrolls with mouse and keyboard and keeps the selection visible while scrolling; the arrows wrap around both ends (the app-wide standard).
- **Hints**: one line spanning the panel width, `action: key` with the key in the attention color: `move: ↑↓`, `open: enter`, `search: ?`, `quit: q`. The clear hint is not here — while a query is active it lives on the band's right, and the band itself shows the query, so a filtered list is never silent.
- **Empty state**: `No repository matches "q"` rendered above the list — the app-wide standard form is `No {type} matches "q"`; no repositories found keeps its dedicated hint.
- **Loading state** (designed 2026-11-17, variant B of the prototype): a bare centered counter — `found: N`, the number in the attention color, three muted dots pulsing after it. No panel, no title band, no hints: the counter sits directly on the terminal background. When the list is complete, the counter swaps for the panel in one frame — the panel with its title band is drawn only then. The progress bar from the pre-redesign list is gone.

### Detail page (2026-11-17)

Chosen in dialogue and prototyped in-repo: `prototipes/Detail.html` (the page, accepted) and `prototipes/ActionPanel.html` (the action panel, accepted) are the visual references.

- **Panel**: the same language as the list page — centered, does not span the full width, thin border with sharp corners, surface background; nothing is written on the border line.
- **Header, one row of three cells**: `branch -> upstream` (left), the repository's path (center, muted, with `$HOME` abbreviated to `~`; a path that still does not fit truncates from the left keeping the repository's name visible), and `↑N / ↓M` (right, attention; idle sides keep their dash). The single row replaces the old title band plus path line.
- **File groups**: staged, unstaged and untracked as three sections with muted titles and counts, separated by faint horizontal bars. One row per file: the marker in a fixed column (attention) and the path. A path that overflows truncates in the middle — first directory, `…`, file name — so head and tail survive; tail-only truncation is rejected (two homonymous files in different directories would be indistinguishable).
- **Selection**: one cursor moves across the whole file list — the arrows cross group boundaries and wrap around the entire list (circular navigation is an app-wide standard). The selected row shows the selection background; there is no separate group focus and no switch key.
- **Quick hints adapt to the group of the selected row**: `unstage: space` while it sits in staged, `stage: space` otherwise. The hints line spans the panel width — `move: ↑↓`, the stage/unstage hint, `panel: p`, `graph: g`, `back: esc`, `quit: q`. The direct shortcuts (`c`, `s`, `f`, `P`) are not hinted; the panel documents them.
- **Feedback line**: the running operation, its output, or the last error's stderr sits between the file list and the hints line, spanning the panel width.
- **States**: a clean repository shows `Repo is up to date` in place of the groups; a broken repository shows `⚠ message` there and its action panel carries only the repo section. The commit input (hidden until `c`; `enter` commits, `esc` cancels) and the feedback line behave per §Views (detail view).
- **Action panel** (opens with `p`; a scrim dims the page behind it): a floating centered box of the same language holding the full catalog grouped by scope — staged, unstaged, untracked (the category actions), repo, and file (the selected row; its section title shows `file:` left and the file name right, muted, truncating). All five sections are always present. Section titles sit in the attention color aligned with the action rows; sections separate by gap plus faint bar. The selection starts on the first row; the arrows are circular; `enter` runs, `esc` closes. Keys mean one thing per context: `p` opens the panel from the detail page and runs pull inside it.
- **Search**: the bar at the top of the panel stays inactive until `?` activates it — the query renders in the attention color and `cancel: esc` appears top-right; typing filters the rows and hides the sections left empty; a query with no matches shows `No action matches "q"` (the app-wide `No {type} matches "q"` standard), so the panel is never silently blank; `esc` cancels — clears the query and exits search back to navigation. The bar exists because the catalog is wide and must stay usable as features land.
- **Descriptions**: hidden by default; `+` toggles them below each action's name. Discard actions render in the warning color.
- **Direct shortcuts**: right-aligned in the attention color next to the actions that earned them (`c` commit, `s` stage all pending, `f` fetch, `p` pull in-panel, `P` push) and working from the detail page without opening the panel — except `p`, which is the panel's own key.
- **Scaling rules** (the panel is the component that absorbs future features): every action lives in exactly one scope section (row, category or repo); a direct hotkey is earned by popularity and an action without one stays reachable through the panel. The panel is one component with a catalog per page, so other pages can host their own.

## Keyboard map (draft — adjust during implementation)

Arrow navigation wraps around everywhere — it is an app-wide standard, not a per-page decision.

| View   | Key                 | Action                                        |
| ------ | ------------------- | --------------------------------------------- |
| List   | `j` / `k` or arrows | Move selection (wraps around)                 |
| List   | `Enter`             | Open detail (search focused: confirm filter)  |
| List   | `?`                 | Search (focuses the band input)               |
| List   | `Esc`               | Cancel search (clears the query, exits mode)  |
| List   | `r`                 | Refresh statuses                              |
| List   | `d`                 | Delete repository (typed-name confirmation)   |
| List   | `q`                 | Quit                                          |
| Detail | `j` / `k` or arrows | Move selection across the groups (wraps around) |
| Detail | `Space`             | Stage/unstage the selected file               |
| Detail | `s`                 | Stage all pending                             |
| Detail | `c`                 | Open commit input                             |
| Detail | `f`                 | Fetch                                         |
| Detail | `P`                 | Push                                          |
| Detail | `p`                 | Open the action panel (inside it: run pull)   |
| Detail | `g`                 | Open the graph page                           |
| Detail | `Esc`               | Back to list (closes panel/search/input first)|
| Detail | `q`                 | Quit                                          |
| Panel  | `↑` / `↓`           | Move selection (wraps around)                 |
| Panel  | `?`                 | Activate search (`Esc` clears and exits it)   |
| Panel  | `+`                 | Toggle action descriptions                    |
| Panel  | `Enter`             | Run the selected action                       |
| Panel  | `Esc`               | Close the panel                               |

## Edge cases

| Case                                   | Behavior                                                                                               |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Detached HEAD                          | Branch shows `detached`; ahead/behind show `—`                                                         |
| No upstream                            | Ahead/behind show `—`; `p` / `P` fail with git's stderr inline                                         |
| Repo deleted between scan and action   | Drop it from the list on next refresh; show the error inline                                           |
| Git command fails                      | Show stderr in the feedback line; never crash the TUI                                                  |
| Rename entries (porcelain `2` records) | Parse the origin path; display `old -> new`                                                            |
| `.git` is a file (worktree)            | Valid repository; listed independently                                                                 |
| Worktree deleted                       | Removed with `git worktree remove --force`; the origin registry is cleaned (no prune needed)           |
| Umbrella repo deleted                  | The confirmation lists every repo in the deletion set with its dirty state; confirming deletes all     |
| Deletion fails (e.g. permissions)      | Message: could not be deleted, remove it manually; the list keeps the repository                       |
| Clean working tree                     | Detail shows a clean state message; `c` with nothing staged surfaces git's error inline                |
| Operation in flight                    | Per-repo running state; keys that would conflict are ignored until it finishes                         |
| TUI crash without destroy              | Terminal may break; `reset` / `stty sane` restores it — bootstrap must call destroy on every exit path |

## Milestones

Each milestone is independently verifiable against its done criteria. Progress is tracked in the [backlog directory](./backlog/README.md); this file stays spec-only.

- **M1 Base TUI** — bootstrap/destroy on all exit paths; two placeholder views; `q` and Ctrl+C exit clean; resize-safe; `typecheck`, `lint`, `fmt:check` green; `bin` field in `package.json`.
- **M2 Discovery** — pruned `$HOME` walk + config; bare found-count while scanning (no progress bar, 2026-11-17), list renders on completion; scanning and empty states.
- **M3 Status** — rows show id, `name / branch`, and merged dirty/ahead/behind (`✱ / ↑N / ↓M` in the attention color, dashes for missing sides, empty cell when fully idle); each repository's status is read as soon as the walk finds it, so the list renders complete as soon as the last status arrives (decision 2026-11-14: no half-filled rows); porcelain parser unit-tested.
- **M4 Detail read-only** — header + grouped file list; background fetch on open with indicator and re-status.
- **M5 Stage + commit** — `Space` / `a` stage and unstage (untracked via `rm --cached`); `c` + `Enter` commits; errors inline; status refreshes after commit.
- **M6 Network ops** — `f` / `p` / `P` run async with running state, output/stderr inline, status refresh on completion; the UI never blocks.
- **M7 Delete** — `d` on the list opens a typed-name confirmation; umbrella sets are enumerated with dirty marks; worktrees go via `git worktree remove --force`; the list refreshes after; failures show a message and never crash the TUI.

## Distribution

- v1 targets Linux x64 only, verified on Ubuntu. macOS, Windows and musl builds are v2.
- Every release carries a standalone `git-station-linux-x64` built with `bun build --compile`; the user needs no bun on their machine.
- Installing is one line from the README, downloading `releases/latest/download/git-station-linux-x64`, with no sudo.
- The binary is built by CI when a version tag is pushed, never from a developer machine.
- npm publishing and `brew` are not v1 goals.

## Testing

- Unit (`bun test`): the porcelain v2 parser (branch lines, entries, renames, detached, no-upstream) and the discovery walker (temporary fixtures: nested repos, `.git` as a file, prune rules, config roots/ignore).
- Manual: the milestone done criteria, exercised against real repositories.

## Known risks

- `gs` is ghostscript's binary on this machine (`/usr/bin/gs`). A global install (`bun i -g`) puts `~/.bun/bin/gs` first in PATH and shadows it. Decide the final binary name before M1's `bin` field is used for a global install.
- `@opentui` 0.5.x is young and its API may churn. Versions are pinned exactly (no `^`) so upgrades stay explicit.
