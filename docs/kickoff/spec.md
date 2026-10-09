# git-station — Spec v1

## 1. Overview

git-station is a terminal UI (TUI) to **discover, monitor and manage multiple local
Git repositories from a single place**. Existing tools of this kind (manygit,
gitpane, gitdeck, etc.) are read-only dashboards: they show you the state of your
repos but you still have to `cd` into each one to actually do anything.

git-station closes that gap: it shows all your repos at a glance **and** lets you
run the day-to-day write operations (`add`, `commit`, `push`, `fetch`, `pull`)
without leaving the TUI.

Stack is already locked: **Bun + TypeScript + `@opentui/react`** (see
`package.json`). This document defines *what* v1 is before any product code is
written.

## 2. Problem

- Developers who work across many repositories lose time and context switching
  between terminal tabs to check status and move changes forward.
- Read-only dashboards solve *visibility* but not *action*: the moment you want to
  stage, commit or push, you leave the tool.
- The friction is the `cd` hop and re-running the same git commands, repeatedly,
  per repo.

## 3. Goals (v1)

1. **Single screen overview.** See every discovered repo with its current branch,
   dirty/clean state, and ahead/behind counts vs. upstream.
2. **Inspect a repo.** Open a repo's detail and see its working-tree changes.
3. **Manage a repo in place.** Run `fetch`, `pull`, `add`, `commit` and `push`
   against a repo directly from the TUI, without changing directories.
4. **Stay live.** Updates are driven by filesystem watching (fs events), not
   polling.
5. **Minimalist UI.** A clean list + detail layout with keyboard-driven controls.

## 4. Non-goals (explicitly out of v1)

- Interactive rebase.
- Stash management.
- Submodule handling.
- Pull requests / forge integrations (GitHub, GitLab, etc.).
- Remote / network-attached repositories (local filesystem only).
- Merge conflict resolution UI.
- Multi-repo batch operations (apply the same action to many repos at once).

These are candidates for later versions, not part of v1.

## 5. Core user flows

### Flow A — Overview
1. App starts and scans the configured root directory.
2. The list shows every repo found, each with: name, branch, dirty indicator,
   ahead/behind counts.
3. The list refreshes automatically when something changes on disk (watch).

### Flow B — Inspect
1. Navigate the list with the keyboard and open a repo.
2. The detail view shows the repo's working-tree changes (staged / unstaged /
   untracked).

### Flow C — Move changes forward
1. In the detail view, stage the desired changes.
2. Write a commit message and commit.
3. Push to the upstream.
4. `fetch` / `pull` are also available from the repo's context.

All of this happens without the user leaving git-station or `cd`-ing anywhere.

## 6. Data model

### Discovery
- The user configures one or more **root directories** to scan.
- On startup, git-station walks each root **fully (no depth limit)** looking for
  `.git` directories; each one is a repository. Bounding or configuring the depth
  is deferred to a future version, exposed through the CLI.
- Ignore rules: skip `node_modules`, hidden non-repo dirs, and anything the user
  excludes via config.
- Config lives at `~/.config/git-station/config.toml` and stores at least: root
  path(s) (`roots`) and ignore patterns (`ignore`).

### Repository view model
Minimal fields needed by the UI, derived from the git binary:

- `path` — absolute path on disk.
- `name` — display name.
- `branch` — current branch (or detached HEAD marker).
- `dirty` — boolean (working tree has changes).
- `ahead` / `behind` — integer counts vs. upstream.
- `changes` — list of working-tree changes (status, path) for the detail view.
- `operationState` — idle / running / error, to drive UI feedback.

## 7. Git integration

- **Mechanism:** shell out to the system `git` binary via subprocesses
  (`child_process` / Bun spawn), always setting the repo path as the working
  directory. No `libgit2` bindings in v1.
- **Read commands used by the UI** (examples, exact flags to be finalized during
  implementation):
  - Status + branch + ahead/behind: `git status --porcelain=v2 --branch`.
  - Working-tree changes: the porcelain v2 records.
- **Write commands:**
  - `git fetch`
  - `git pull`
  - `git add <paths>`
  - `git commit -m <message>`
  - `git push`
- **Rules:**
  - All calls are async and scoped per repo; never block the UI thread.
  - Never run a destructive command without an explicit user action.
  - Failures surface as an inline error state on the affected repo, never a crash.

## 8. UI / interaction

- **Layout:** minimal. A repo **list** as the primary view, and a **detail** view
  for the selected repo.
- **List:** one row per repo with name, branch, dirty marker, ahead/behind.
- **Detail:** working-tree changes, plus the actions (fetch/pull/add/commit/push).
- **Navigation:** keyboard only for v1.
- **Keybindings:** centralized and documented in-app. Concrete map is defined
  during implementation, but v1 needs at least: move selection, open/close detail,
  stage, commit, push, fetch, pull, quit.
- **Feedback:** running operations show a per-repo busy state; results and errors
  are shown inline.

## 9. Live updates (watch, not polling)

- git-station uses **filesystem watching** to keep repo state fresh.
- Watching the `.git` directory of each repo (and the scan root for new/removed
  repos) is the expected approach.
- Decision: use native `fs.watch` on each repo's `.git` directory. If a spike
  shows native events are unreliable (cross-platform), fall back to
  `@parcel/watcher`. **Polling is not acceptable as the refresh mechanism.**
- Events are debounced so bursts of writes (e.g. during a checkout) don't thrash
  the UI or spam git calls.

## 10. v1 scope / milestones

1. **Skeleton:** app boots the OpenTUI shell with the list layout and static
   placeholder data.
2. **Discovery + read:** scan root, list real repos, show branch/dirty/ahead/behind.
3. **Watch:** live refresh on fs changes.
4. **Detail:** per-repo changes view.
5. **Write ops:** fetch/pull/add/commit/push with inline feedback.
6. **Polish:** keybinding help, error states, config for root + ignores.

## 11. Resolved decisions

- **Config format/location:** TOML at `~/.config/git-station/config.toml` with
  `roots` and `ignore`.
- **Scan depth:** v1 walks each root fully (no depth limit); configurable depth is
  deferred to v2 via the CLI.
- **Watcher strategy:** native `fs.watch` per `.git`, fallback to
  `@parcel/watcher` only if the native spike proves unreliable.
- **Commit message UX:** single-line input in v1; multiline deferred.
- **Push behavior:** `git push`; when a branch has no upstream, offer
  `git push -u origin <branch>`.
