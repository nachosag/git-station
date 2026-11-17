# Prototype standard (law since 2026-11-17)

Every HTML prototype in this directory follows one standard, so comparing pages compares design, not styling drift.

## Shared tokens

Every prototype declares the exact same `:root` block — the semantic tokens that `theme.ts` will later mirror. Colors come from Tokyo Night:

```css
:root {
  --bg: #16161e;         /* terminal background behind the panel */
  --surface: #1a1b26;    /* panel background */
  --border: #3b4261;
  --separator: #282c3f;  /* faint lines between rows / sections */
  --text: #c0caf5;
  --muted: #565f89;
  --attention: #e0af68;  /* keys, sync counts, markers, section titles */
  --warning: #f7768e;    /* destructive actions */
  --selection: #2f334d;  /* selected-row background */
  --font: "JetBrains Mono", "Fira Code", monospace;
}
```

- Font: `16px/1.5` through the `--font` token, family `"JetBrains Mono", "Fira Code", monospace`, everywhere. The size is pinned because ch-based widths (the `110ch` panel) depend on it: one font size, one panel width.
- One token per role; never name a color by its value; never invent a page-specific color.

## Interactivity

A prototype is not a screenshot: every page is keyboard-driven end to end, with the keys it will really have (Listing and Detail set the bar — arrows move a selection that wraps around, `?` activates search, `p` opens the action panel over the dimmed page). Non-interactive variants (states, close-ups) are labeled as such.

## Files

- One file per page or reusable surface, named after it (`Listing.html`, `Detail.html`, `ActionPanel.html`). The accepted version is always the one in this directory, committed.
- `Detail.html` embeds `ActionPanel.html` via iframe (`p` opens it; `esc` inside closes it and posts `close-panel` to the parent). The panel exists once — the detail never duplicates it. The iframe is a prototype-only artifact: in opentui the panel is a mounted component.

## Sizes

One test-terminal size for every prototype, so screenshots compare the same canvas:

- **Terminal** (`.term`): `80rem × min(42rem, calc(100vh - 4rem))`, centered on a `100vh` body with `2rem` of breathing room — the canvas fills the window's height and caps at `42rem` on tall monitors. Pages never fill the terminal edge to edge in the design, and the prototype must show that — the terminal background stays visible around the panel.
- **Page panels** (Listing, Detail): `width: min(110ch, 92%)`, `height: min(36rem, 94%)` — a centered panel that never spans the full terminal.
- **Floating surfaces** (ActionPanel): `width: min(62ch, 90%)` — standalone `max-height: 86%` of the window; embedded in Detail the iframe lives inside the page panel and is `height: min(30rem, 88%)` **of it**, so it centers over the page and can never escape it.

## Shared chrome

One rhythm for every page panel (Listing, Detail), so the pages are interchangeable:

- **Horizontal padding:** `2rem` on every band, row and hint line.
- **Top band** (Listing's search, Detail's meta): `padding: 0.55rem 2rem`, `border-bottom: 1px solid var(--border)`.
- **Rows:** `padding: 0.55rem 2rem`; the selection is a full-width `var(--selection)` background.
- **Hints:** `padding: 0.6rem 2rem 0`, `border-top: 1px solid var(--border)`; the panel carries `padding-bottom: 0.7rem` under them.
- **Lines:** structural edges (top band, hints) use `var(--border)`; faint internal separators (between rows or sections) use `var(--separator)`.
- **Keys:** `<kbd>` elements in `var(--attention)` — never `<b>` or bare text.
- **Scrollbars:** `scrollbar-width: thin; scrollbar-color: var(--border) transparent` on every scroll container.

Floating surfaces (ActionPanel) keep their own compact scale — smaller type and narrower indents are the dialog's design — but share the tokens, the font and the `<kbd>` rule.
