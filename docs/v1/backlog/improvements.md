# Improvements

Accepted proposals from closing stories (`IMP-001`, `IMP-002`…), with the same checkboxes, sub-steps and `Verified by` lines as stories. The Status table in [README.md](./README.md) is the at-a-glance state. `IMP-003` stays reserved for the list-scrolling proposal noted under US-005.

## IMP-001: Simplify the directory walk in src/repo.ts

**Priority:** polish · **Size:** S · **Depends on:** US-002

**Description**

Accumulate the found repositories in a plain string array during the recursive walk, instead of pushing one promise per directory and flattening everything with `Promise.all(...).flat()` at the end. Behavior must not change: same repos found, same order of skipping, and a failure reading one subdirectory must not lose the repositories found in sibling directories.

**Acceptance criteria**

- [x] Given the existing test suite, when the refactor is done and `bun test src/repo.test.ts` runs, then every test passes without changes to the tests.
- [x] Given a directory tree where one subdirectory cannot be read, when the walk runs, then it still returns every repository found in the readable directories.

  Verified by: src/repo.test.ts — existing tests pass unchanged + one new test for the unreadable directory (written)

## IMP-002: Ship a Linux binary with a one-line install

**Priority:** must (v1 scope, decided 2026-11-12) · **Size:** M · **Depends on:** US-001

**Description**

Make `git-station` installable by someone who does not have bun: every release publishes a standalone `git-station-linux-x64` executable built on Linux, and the README's install line downloads it from the latest release without sudo. macOS, Windows and musl builds stay out of v1.

**Acceptance criteria**

- [ ] Given a pushed version tag, when CI finishes, then the release carries a `git-station-linux-x64` executable built from that tag.
- [ ] Given a machine with no bun installed, when the built file runs, then the list view opens and quits cleanly.
- [ ] Given a fresh Ubuntu, when the README's install line runs, then `git-station` is executable and on the PATH.
- [ ] Given the README, then it shows the install line, where the file lands, how to remove it, and that only Linux x64 is supported.

**Out of scope**

- macOS, Windows and musl builds (v2).
- npm, `brew`, `.deb` and auto-updating.

**Notes / open questions**

- Decision (2026-11-15): deferred to the end of the backlog. The user wants the release work — CI, tag, binary, README install line — after every other story is done, so this improvement goes last instead of before the next story's first step.
- Verified 2026-11-12: `bun build --compile src/index.tsx` produces a 96 MB self-contained binary that runs from another directory, opentui's native library included.
- Cross-compiling from Linux to another OS fails until that platform's opentui package is installed; CI builds on Linux instead.
- `latest/download/<asset>` gives a stable URL, so the install line never changes between versions.

## IMP-004: Tighten the status naming and path reading

**Priority:** polish · **Size:** S · **Depends on:** US-003

**Description**

Three cleanups accepted when US-003 closed: the two maps returned by `scan` are named by outcome instead of by shape, the row name comes from `basename` instead of splitting the path by hand, and the loading counter in `App` is a number instead of an array of paths that nothing else reads.

**Acceptance criteria**

- [x] Given `scan`, when it returns, then the maps are `readable` (path → status) and `unreadable` (path → message), and `App`, the presenters and the tests use those names.
- [x] Given a repository path, when the row name is built, then `basename` returns the last segment and the `?? repo` fallback is gone.
- [x] Given the loading screen, then `App` counts the repositories found instead of collecting their paths.

  Verified by: `bun run check` — the 19 tests pass unchanged after the rename (written 2026-11-15). Behavior is identical: the row and detail output are the same strings.

**Notes**

- `IMP-003` stays reserved for the list-scrolling proposal noted under US-005.

## IMP-005: Compute the detail view only when it opens

**Priority:** polish · **Size:** S · **Depends on:** US-005

**Description**

`App` currently builds one `DetailView` per repository as soon as the scan finishes and keeps the whole array in state — 23 of them on this machine, for a view that shows one at a time. Build the detail view for the selected repository only, when the detail opens, instead of precomputing all of them.

**Acceptance criteria**

- [x] Given the scan finishes and the list renders, then the `DetailView` array of 23 is gone and only the selected repository's detail exists — one per render, not one per repository — and the first render with an empty list does not crash.

  Verified by: eye (written 2026-11-15 — the list opens without delay, Enter shows the same detail as before, Esc and Enter on the same repo show the same content, and `bun run dev` starts with an empty list without the `reading 'path'` crash).

  Decision (2026-11-15): the `screens` object literal stays and the detail branch is guarded with `rows[selectedRow] ? … : null`, instead of moving the whole screen to a function. The guard is what stops the first render from reading `path` off an empty list; the cost is that the selected repository's detail is rebuilt on every render, including while the list is shown. Rewritten criterion: the original wording ("no `DetailView` has been built yet") is false under this approach, so it now says what is actually verified.
- [x] Given a repository selected in the list, when Enter opens the detail, then the header and the three groups show the same strings as before.
- [x] Given a repository whose status could not be read, when Enter opens its detail, then the `⚠` message and the three empty groups still render.
- [x] Given the detail open, when Esc returns to the list and Enter opens the same repository again, then the detail renders the same content.

**Notes / open questions**

- A test may not be worth it: the strings come from `toDetailView`, already covered by `src/presenters.test.ts`; what changes is when it is called, and that is visible on screen. Decide the `Verified by` line when the step is planned.

## IMP-006: Componentize the UI layer

**Priority:** polish (before US-006) · **Size:** M · **Depends on:** US-004, US-005

**Description**

The views have grown by accretion: `Listing` renders the search field, the no-matches message, the table, and three hint lines in one `return`; `Detail` repeats the same `<text>` hint pattern; the list table and the detail file groups are two unrelated renderings of the same idea. Before US-006 to US-011 add fetch, pull, push, stage and commit keys, split the repeated visual elements into components so each screen composes them instead of re-implementing them. Scope: structure only — what the screens show does not change.

**Acceptance criteria**

- [x] Given `App` and `Listing`, then the search text is named `query` everywhere (state, setter and prop).

  Verified by: `bun run check` green (24 tests unchanged) and eye (written 2026-11-16). `query`/`setQuery` in `App`, `query` prop in `Listing`; `onInput` keeps its name because it mirrors the field's event.
- [x] Given the key hints at the bottom of both views, then they come from one component, and changing a view's hints touches one place.

  Verified by: eye (written 2026-11-16 — `HintBar` takes `hints: { key, action }[]` and renders one `<text>` per hint; `Listing` keeps Open/Quit in one array plus a conditional first hint, `Detail` keeps Back/Quit; all five lines render with the same text and order as before).
- [x] Given the list table and the detail file groups, then both render through the same row primitive and the column sizes are declared once.

  Verified by: eye (written 2026-11-16 — `bun run dev`: la tabla y los grupos del detalle muestran lo mismo, con el marcador en columna fija y el nombre a lo ancho). Con la opción 2 los tests existentes de `presenters` se actualizaron a la nueva forma del dato (`FileCell`); no se agregaron tests nuevos. `Cols` es el único primitivo de fila: `Header`/`Row` en `Listing` y los tres grupos en `Detail`. Anchos: `WIDTHS` en `Listing`, `FILE_WIDTHS` en `Detail`, cada uno declarado una vez.
- [x] Given the search field, then it is one component that takes `query`, `searching` and the change handler; the clear hint stays in `Listing`, in the conditional `HintBar`.

  Verified by: eye (written 2026-11-16 — `bun run dev`: `/` abre el campo, escribir filtra igual que antes, el hint condicional no cambió). `bun run check` verde (25 tests).

  Decision (2026-11-16): the prop is `isSearching`, not `searching` — it keeps the name `Listing` already used, so no prop was renamed just to move.

  Decision (2026-11-16): approach B — the component is the field only, so the screen stays exactly as it is today. The original wording ("the search field and its clear hint are one component") was false under this approach, so it now says what is actually verified.
- [x] Given both views, then behavior is unchanged: list selection, filtering, no-matches state, detail header, groups and scroll, all checked by eye.

  Verified by: eye (written 2026-11-16 — recorrida completa de ambas vistas en `bun run dev`: selección con `j`/`k`, filtro con `/`, mensaje de sin coincidencias, header del detalle, los tres grupos y el scroll).

**Notes / open questions**

- Every test today is `eye`: this pass must not need new tests, since the output strings and keystrokes stay the same. If a step turns out to change behavior, that is a sign the step was too big.
- A headless test of the key sequence (`/` → `coll` → Enter → Esc) was proposed at US-004's close and not taken. Revisited after IMP-006 (2026-11-16) and declined by the user — the eye checks stand; do not raise it again.
- Plan (2026-11-16): the layout is `src/pages/` (the three existing screens) plus `src/components/`. The criteria map to components: hints → `HintBar` taking `hints: {key, action}[]` (hints as data, so the new keys of US-006+ become entries, not code); row primitive → `Cols`, under `Table`'s Header/Row, with `Group` for the detail file blocks; search field → `SearchField` taking `query`, `searching` and the change handler. One-use visuals stay local to their page: `Info`, the centered detail header, the no-matches message. Colors move with the code unchanged; the new look is IMP-007's.
- Open (decide when the row-primitive step is presented): the detail file line is a single string (`\t M name`); rendering it through `Cols` as marker + name columns changes the spacing slightly, while keeping it a string leaves the shared-primitive criterion half-met.

## IMP-007: Theme and component styling

**Priority:** polish (after IMP-006, before US-006) · **Size:** L · **Depends on:** IMP-006

**Description**

Accepted 2026-11-16 while planning IMP-006. The components land with today's colors so the structure pass stays verifiable (output identical, string by string); the visual language gets its own pass on top of stable props. Today three `gray` usages mean three different things (detail header background, selected-row background, column-label foreground) and the style choices are hardcoded in the views. opentui 0.5.x supports `border`, `borderStyle`, `title`, `titleColor`, `padding` and `margin` (confirmed against the API docs 2026-11-16).

Expanded (2026-11-17): the pass defines the design in its totality, page by page — which components each page shows and in what order, sizes and spacing, and the look of every element — plus colors and visual details. First the standard, then each page's design in dialogue, then the implementation. Approaches chosen (2026-11-17): semantic tokens (named for the role they play, never for their color value), one `theme.ts` holding the tokens and nothing else, and direct props always with the `style` prop only when no direct prop covers the need.

**Acceptance criteria**

- [x] The styling standard is written into SPECS.md (§Design) before any styling code: token naming, where styles live (theme file vs component), and direct props vs the `style` prop.

  Verified by: eye (written 2026-11-17 — el usuario confirmó que la sección §Design dice exactamente lo que eligió: tokens semánticos, `theme.ts` con los tokens y nada más, props directas primero y `style` solo como último recurso)

- [x] The list page design is written into SPECS.md in full: which components it shows and in what order, sizes and percentages, spacing, and the look of every element — including its states (loading, empty, filtered).

  Verified by: eye (written 2026-11-17 — el usuario confirmó que el texto dice lo que eligió: la variante B del prototipo, contador pelado `found: N` sobre el fondo de la terminal con tres puntos muteados pulsando, sin panel ni hints hasta que la lista está completa; la barra de progreso desaparece de §Discovery y de M2)

- [x] The detail page design is written into SPECS.md in full, same shape as the list page step.

  Verified by: eye (written 2026-11-17 — el usuario confirmó que el texto dice lo que elegimos: detail con header de una fila y selección única circular, action panel contextual de cinco secciones con búsqueda (`?`), descripciones (`+`) y atajos naranjas; el prototipo aceptado vive en `prototipes/Detail.html` y `prototipes/ActionPanel.html`. Durante la revisión del texto se agregaron: flechas circulares como estándar de la app, fuera `tab`, y la quick action `graph: g` que origina US-013)

- [x] Given the theme, then it is one file of tokens (at least: `selection`, `muted`, `warning`) and no screen or component hardcodes a color.

  Verified by: grep — sin valores de color en `src/` fuera de `theme.ts`, corrido al cerrar (written 2026-11-17) + eye (written 2026-11-17 — `bun run dev`: la fila seleccionada y el header del detalle se ven igual que antes). `bun run check` verde (25 tests).

  Decision (2026-11-17): `Detail`'s header reads `selection` instead of gaining a fourth token — `selection` is the only background role that exists today, and the header gets its own role (or disappears into the panel) in the redesign step, where its look is designed.

- [x] Given each component, then its look comes from the theme: `HintBar` (key vs action), `Table` (column labels, selected row), `Group` (title), `SearchField`, the detail header, and `Loading`.

  Verified by: eye (written 2026-11-17 — el usuario confirmó en `bun run dev`: claves de los hints y el número de `found: N` en naranja, etiquetas de columna y títulos de grupo en gris; `bun run check` verde, 25 tests).

  Decision (2026-11-17): `Cols` recibe un `fg?: string` opcional para todas sus celdas, no un color por celda — el header es el único que lo necesita hoy. Se pasa con spread condicional porque `exactOptionalPropertyTypes` no acepta un prop `fg` presente con valor `undefined`.

- [ ] Given both views, then the data flow and the information shown stay identical (display-only: dirty, ahead and behind merge into one `✱ / ↑N / ↓M` column, per the page designs), keys follow the updated keyboard map, and the screens are rebuilt to match SPECS.md §Design.

  Verified by: eye (planned)

  Rewritten (2026-11-17): the original wording ("keys, data flow and screen structure are identical; only the look changes") became false under the full redesign of the list page — the filter key changed from `/` to `?`, the screen structure changes (title band, merged columns), and the dirty mark leaves the list by design.

  Split (2026-11-17): the criterion covers the data shape, three screens and the keyboard map; it cannot be one sitting. These sub-steps are the plan.

  - [x] The presenters hand the views the data in the new shape: one display string for the `✱ / ↑N / ↓M` column (dashes for missing segments, empty for an idle repository), and the detail header's three values (branch -> upstream, path, ahead / behind). No status data changes.

    Verified by: src/presenters.test.ts — all nine tests rewritten for the new shape (written 2026-11-17). `bun run check` green (28 tests).

    Decision (2026-11-17): `RowView` is now `{ repoPath, repoName, branch, display }` and `DetailView.repoPath` replaces `path`; the names avoid colliding with a file's `path`. The header's branch/upstream separator is `->`, matching the rename display; SPECS.md §Design was updated to match.

  - [ ] `Loading` is the bare centered `found: N` counter with three muted dots pulsing, directly on the terminal background — no panel, no title, no hints, no progress bar.

    Verified by: eye (planned)

  - [ ] `Listing` is rebuilt to SPECS.md §Design: centered bordered panel, search band with `?` and `cancel: esc`, `id` / `repo / branch` / merged-mark columns, faint separators, scrolling that keeps the selection visible, hints line, and the empty and no-matches states.

    Verified by: eye (planned)

  - [ ] `Detail`'s page is rebuilt to SPECS.md §Design: one-row header, the three file groups with one circular cursor, adapted hints, the feedback line, and the clean and broken states.

    Verified by: eye (planned)

  - [ ] The action panel opens from `p` with the five scope sections, its inactive search bar, `+` descriptions, circular selection and the scrim over the page; it lists the full catalog and the five story actions are wired.

    Verified by: eye (planned)

  - [ ] The keyboard map across both views follows SPECS.md: `?` focuses search, arrows wrap around everywhere, `Esc` unwinds one layer, direct shortcuts work from the detail page and `q` quits.

    Verified by: eye (planned)

**Notes / open questions**

- Decided (2026-11-17): semantic tokens, one theme file of tokens only, direct props first — recorded in SPECS.md §Design.
- Per-state colors (e.g. the behind count highlighted when it is above zero) would need the presenters to return structured cells instead of preformatted strings (`'↑ 2'`). The first pass colors whole lines and leaves that decision open.
- Add tokens only when a component needs one; the set above is the floor, not the ceiling.
- Design dialogue (2026-11-17): every page's discussion opens with one question — redesign from scratch or keep the structure — before any detail; the look is prototyped as HTML (kept in `prototipes/` since 2026-11-17) and reviewed live in the browser (live-server) before being written into SPECS.md.
- Listing page (2026-11-17): full redesign chosen over keeping the structure — centered panel that does not span the full width, scrollable repository list (absorbs the list-scroll proposal noted under US-005; `IMP-003` stays reserved for it), minimalist look, taking full advantage of opentui (`border`, `borderStyle`, `title`, `padding`). The "only the look changes" wording of the behavior criterion becomes false under a redesign: it will be rewritten when the design lands in SPECS.md.
- Listing revisions (2026-11-17, protos 10–11, feedback annotated as it arrived): dirty returns inside the merged `dirty / ahead / behind` column; the band becomes an always-visible search input on the left with `clear: esc` on the right while a query is active (the `git-station` title dropped); hints restored as `move / open / search / quit`; the arrows wrap around (app-wide standard); the no-matches message standard `No {type} matches "q"` lands in the Listing and in `prototipes/ActionPanel.html`; `prototipes/Detail.html` is trimmed to the page-only variant — the action panel lives only in `prototipes/ActionPanel.html` (the detail page uses the panel and dims the page behind it, per §Design).
- Cross-page standard pass (2026-11-17, live review feedback on Listing + Detail): the shared chrome now lives in `prototipes/README.md` (§Shared chrome) — `2rem` horizontal rhythm, `0.55rem` row padding, structural lines in `--border` vs internal separators in `--separator`, `<kbd>` keys, thin scrollbars, and the font pinned at `16px/1.5` (the `110ch` panel width depends on the font size, which is why Listing and Detail rendered at different widths). `Detail.html` adopts Listing's frame and chrome: its hint bar and rows were cramped, and its body drifted from the standard (no breathing room, unpinned font). Both page panels grow to `min(36rem, 94%)` on a viewport-tall terminal — both were capped at `28rem` and wasted vertical screen. Listing adopts Detail's width through the shared frame, and its `id` column header becomes `#`. ActionPanel aligns keys (`<b>` → `<kbd>`) and its structural lines to the standard; its compact type and indents stay (floating-surface scale).
- Prototype fixes (2026-11-17, second live review pass): the Listing no-matches message renders above the list, not below the empty list; the action panel keeps the selected row's section title visible — going down and back up left the `staged` title above the fold because the row itself was already visible and `nearest` did not scroll (the fix brings the section in when the selection lands on its first row); the embedded panel grows to `min(30rem, 88%)` of the hosting detail panel and now lives inside it, so it can never escape the page.

## IMP-008: Declare the table columns once

**Priority:** polish · **Size:** S · **Depends on:** IMP-006

**Description**

Accepted 2026-11-16 as a proposal after the shared row primitive landed: `Header` and `Row` in `Listing.tsx` each wrote out the same five cells with the same keys and order. The widths came from `WIDTHS` (one declaration), but the table's shape was duplicated. A single `COLUMNS` list next to `WIDTHS` is now the only place that declares which columns exist, their order and their widths; both views map over it.

**Acceptance criteria**

- [x] Given `Header` and `Row`, then both build their cells from one `COLUMNS` list, so adding or reordering a column touches one place.

  Verified by: `bun run check` green (25 tests unchanged) and eye (written 2026-11-16 — the table shows the same five columns in the same order; output identical).

**Notes / open questions**

- `field` exists because the `repo` column displays `RowView.name`: the header label and React key are `repo`, but the property is `name`. Indexing `props.view[column.key]` raised TS7053, hence the separate field.

## IMP-009: Confirm the search with Enter before moving

**Priority:** polish · **Size:** S · **Depends on:** US-004

**Description**

Requested 2026-11-16, in the middle of IMP-006. First reading corrected by the user: while the search field is focused the keyboard belongs to it — no row movement. What is missing is the way out: today the only paths away from the field lose the filter (Esc clears it) or go through the detail view (Enter opens it). Design chosen (B): while typing, `Enter` confirms the filter and leaves the field keeping the query; a second `Enter` opens the detail; `Esc` keeps clearing the filter in every state. SPECS.md §States and §Keyboard map record it.

**Acceptance criteria**

- [x] Given the search field focused after typing a query with matches, when I press `Enter`, then the field is left with the query and its filtered rows intact, `j`/`k` and the arrows move the highlight among them, and a second `Enter` opens the detail of the selected row.

  Verified by: eye (written 2026-11-16 — `bun run dev`: Enter tras escribir confirma y deja la query con el marcado en la lista, `j`/`k` mueven entre las filtradas y el segundo Enter abre el detalle). `bun run check` verde (25 tests).

**Notes / open questions**

- The early-return guard inside `isSearching` is what keeps the field's keyboard separate: flattening it into `isSearching && ...` conditions let one key press fire both the confirm and the open (React state closures do not update mid-handler), plus `q` quit and `j`/`k` moved while typing. The guard stays.

## IMP-010: Wire the full action catalog

**Priority:** polish (before US-006) · **Size:** M · **Depends on:** IMP-007

**Description**

Accepted 2026-11-17 while designing the detail page (option A of two): the action panel designed in §Design (detail page) shows the full catalog — 19 actions across five scope sections — but only the five story actions are wired when IMP-007 closes. This improvement wires the rest so the panel opens complete and its search bar earns its keep from day one: unstage all, refresh status, open in editor (repo and file), open terminal here, copy path (repo and file), copy remote url, open on remote (repo and file), and the three discard actions. Every one is shell-level or a single git command — no new plumbing. Goes before US-006.

**Acceptance criteria**

- [ ] Given the detail view, when the action panel opens, then every catalog action is listed and running a utility one produces its effect (the editor opens on the repo or file, the clipboard holds the path or the remote URL, the terminal drops into the repo, the remote page opens in the browser).
- [ ] Given pending changes, then stage all, unstage all, and the discards move exactly the files their section describes and an external `git status` confirms the tree.
- [ ] Given a discard action, then a confirmation step guards it before anything is dropped — it is irreversible, and its row renders in the warning color.
- [ ] Given a failing utility action (no remote configured, no clipboard, no `$EDITOR`), then its error shows in the feedback line and the app keeps running.

**Notes / open questions**

- The design already describes the catalog (§Design, detail page); this improvement only wires it. Scope was chosen over leaving the panel half-empty at the rebuild — the alternative (no search bar in v1, catalog deferred to v2) was rejected the same day.
