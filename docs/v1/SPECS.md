# git-station v1 Specification

git-station (`gs`) is a keyboard-driven terminal UI to discover, monitor, and manage every local git repository on the machine from one place. Unlike read-only dashboards (manygit, gitpane, gitdeck), v1 lets the user run the everyday write operations — stage, commit, fetch, pull, push — without leaving the TUI or changing directories. This document is the single source of truth for v1 scope and behavior.

## Core decisions

| #   | Area         | Decision                                                                                                                                                                                 |
| --- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Discovery    | Hybrid: walk `$HOME` pruning heavy directories + optional config for extra roots and ignores. No cache in v1 (scan on open).                                                             |
| D2  | Layout       | Stacked full-screen views: the list is the home screen; `Enter` opens the detail view; `Esc` goes back. No split panes.                                                                  |
| D3  | Detail scope | Header + file list (staged/unstaged/untracked) + one-line commit + fetch/pull/push. No log, diff, or branch checkout in v1.                                                              |
| D4  | Network      | The list always shows local state (`git status`). Opening a detail view triggers a background `fetch` (with indicator) followed by a re-status. No fetch-all, no other implicit network. |
| D5  | Git adapter  | Always shell out to the `git` binary via `Bun.spawn` with `git -C <path>`. No git library. `git status --porcelain=v2 --branch` is the single source of repo state.                      |

## Goals (v1)

- Show every detected repository with: name, current branch, dirty indicator, ahead/behind counts vs upstream.
- Open a detail view for any repository.
- Run fetch, pull, stage, commit, and push from the TUI without `cd`-ing or leaving `gs`.
- Delete a repository from the list — regular repos, umbrella repos (with every nested repo), and worktrees — behind a typed-name confirmation.
- Clean, keyboard-driven design: one list, one detail view.

## Non-goals (v1)

Interactive rebase, stash management, submodules, pull requests / platform integrations (GitHub, GitLab), remote or network-hosted repos, merge conflict resolution UI, applying one action to many repos at once (including fetch-all).

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
4. Show repositories as they are found; the list fills incrementally behind a progress indicator.

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

Known ceiling: scanning on every open costs seconds on a large `$HOME`. Upgrade path: persist the last scan in a state file, render it instantly on open, rescan in the background.

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

States: scanning (progress indicator while the walk runs), empty (no repositories found, with a hint), filtered (`/` narrows by name substring).

### Detail view

Sections, top to bottom:

1. Header: absolute path, branch, upstream, ahead/behind, dirty counts (staged / unstaged / untracked).
2. Files: three groups — staged, unstaged, untracked. One row per file; renames display `old -> new`.
3. Commit input: hidden until `c` is pressed; one-line input, `Enter` commits, `Esc` cancels.
4. Feedback line: the running operation (`fetch…`, `push…`), its output, or the last error's stderr.

Opening the detail view renders the local status immediately; a background `fetch` runs (D4) and a re-status refreshes ahead/behind when it completes.

## Keyboard map (draft — adjust during implementation)

| View   | Key                 | Action                                        |
| ------ | ------------------- | --------------------------------------------- |
| List   | `j` / `k` or arrows | Move selection                                |
| List   | `Enter`             | Open detail                                   |
| List   | `/`                 | Filter by name                                |
| List   | `r`                 | Refresh statuses                              |
| List   | `d`                 | Delete repository (typed-name confirmation)   |
| List   | `q`                 | Quit                                          |
| Detail | `Esc`               | Back to list (cancels the commit input first) |
| Detail | `j` / `k`           | Move over files                               |
| Detail | `Space`             | Toggle stage/unstage file                     |
| Detail | `a`                 | Stage all                                     |
| Detail | `c`                 | Open commit input                             |
| Detail | `f`                 | Fetch                                         |
| Detail | `p`                 | Pull                                          |
| Detail | `P`                 | Push                                          |

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

Each milestone is independently verifiable against its done criteria. Progress is tracked in [BACKLOG.md](./BACKLOG.md); this file stays spec-only.

- **M1 Base TUI** — bootstrap/destroy on all exit paths; two placeholder views; `q` and Ctrl+C exit clean; resize-safe; `typecheck`, `lint`, `fmt:check` green; `bin` field in `package.json`.
- **M2 Discovery** — pruned `$HOME` walk + config; list shows repository names as they are found; scanning and empty states.
- **M3 Status** — rows show name, branch/detached, dirty, `↑N ↓M` or `—`; statuses load without blocking the UI; porcelain parser unit-tested.
- **M4 Detail read-only** — header + grouped file list; background fetch on open with indicator and re-status.
- **M5 Stage + commit** — `Space` / `a` stage and unstage (untracked via `rm --cached`); `c` + `Enter` commits; errors inline; status refreshes after commit.
- **M6 Network ops** — `f` / `p` / `P` run async with running state, output/stderr inline, status refresh on completion; the UI never blocks.
- **M7 Delete** — `d` on the list opens a typed-name confirmation; umbrella sets are enumerated with dirty marks; worktrees go via `git worktree remove --force`; the list refreshes after; failures show a message and never crash the TUI.

## Testing

- Unit (`bun test`): the porcelain v2 parser (branch lines, entries, renames, detached, no-upstream) and the discovery walker (temporary fixtures: nested repos, `.git` as a file, prune rules, config roots/ignore).
- Manual: the milestone done criteria, exercised against real repositories.

## Known risks

- `gs` is ghostscript's binary on this machine (`/usr/bin/gs`). A global install (`bun i -g`) puts `~/.bun/bin/gs` first in PATH and shadows it. Decide the final binary name before M1's `bin` field is used for a global install.
- `@opentui` 0.5.x is young and its API may churn. Versions are pinned exactly (no `^`) so upgrades stay explicit.
