# Web Design Generation Prompt

## Purpose

Generate a complete visual design for a local-first AI coding assistant web application. The interface surfaces multiple specialist AI task workflows through a single routing layer. All inference runs locally via Ollama — there is no cloud cost or external API dependency.

---

## Technology Constraints

- **Framework:** Astro 6 (static shell, islands architecture)
- **UI layer:** React 19 (client islands only, not full-page hydration)
- **Styling:** Tailwind CSS v4 utility classes, CSS custom properties for theming
- **Typography:** System font stack, monospace for code/labels
- **Theme:** Light and dark mode support via CSS variables (`background`, `foreground`, `primary`, `muted`, `border`, `card`)
- **Layout max-width:** `max-w-7xl`, centered, horizontal padding `px-4 md:px-6`
- **Border radius:** Rounded corners throughout (`rounded-lg`, `rounded-xl`, `rounded-2xl`)
- **No external icon library required** — use inline SVG or Unicode symbols

---

## Page Inventory

The application has three page types:

1. **Overview page** (`/`) — landing and navigation hub
2. **Task workspace** (`/tasks/[slug]`) — single-task AI interaction view
3. **Settings page** (`/settings`) — model configuration panel

Design all three page types.

---

## Section Specification

### Overview Page (`/`)

#### Section 1 — Persistent Navigation Bar

**Utility:** Global navigation and access to global controls. Sticky at the top, always visible during scroll.

- Logo mark (small square icon) + application name on the left
- Inline nav links: Overview, Platform, Workflow, Tasks (anchor links to page sections)
- Right-side controls: one icon button to open model configuration dialog, one icon button to toggle light/dark theme
- Thin bottom border, frosted glass background (`backdrop-blur`)
- Height: `h-14`

---

#### Section 2 — Hero

**Utility:** Communicate the product's core value proposition and provide primary entry-point CTAs.

- Two-column layout on large screens: left column for text, right column for a compact scope summary card
- Left column contents:
  - Small pill badge above the headline (e.g., "Local-first coding copilot with task-specialist routing")
  - Large bold headline (2–3 lines, `text-3xl` to `text-5xl`)
  - Short descriptive paragraph (`text-sm` to `text-base`, muted color)
  - Two CTA buttons side by side: primary filled button ("Open Task Workspace") and secondary outlined button ("Browse Task Catalog")
- Right column contents (compact card):
  - Section label in small uppercase monospace
  - Two sub-cards inside a 2-column grid: "Analysis" tasks list and "Generation" tasks list
  - One line of supporting copy below the sub-cards
- Decorative background: two large blurred radial gradient blobs behind the content (`blur-3xl`, low opacity)
- Outer container: rounded card with border, `bg-card`

---

#### Section 3 — Metrics Bar

**Utility:** Reinforce platform scale and key differentiators at a glance using numbers.

- 4-column grid (2 columns on small screens)
- Each card contains: a large bold primary-colored number, a short label, and a subdued descriptor line
- Example metrics: number of specialist tasks, analyst model count, translation target count, cloud API cost ($0)
- Cards: `rounded-xl`, bordered, light shadow

---

#### Section 4 — Platform Architecture

**Utility:** Explain the three-plane internal architecture (routing, execution, UX) to technically-minded users.

- Section heading + one-line subtitle
- 3-column card grid
- Each card: small pill badge (e.g., "Routing Intelligence"), bold title, descriptive paragraph
- Cards: `rounded-xl`, bordered, `bg-card`

---

#### Section 5 — Operational Workflow

**Utility:** Show the end-to-end lifecycle of a single request, from paste to output, as a numbered sequence.

- Section heading + one-line subtitle
- 5-column grid on large screens, 2 columns on medium, 1 on small
- Each step card: monospace step number (01–05), bold step title, short description
- Cards: `rounded-xl`, bordered

---

#### Section 6 — Task Catalog

**Utility:** Give users a browsable grid of all available AI tasks with their assigned model and a direct entry link.

- Section heading + subtitle on the left; "Adjust model assignments" text link on the right
- Grid of task cards (React island, reads live model config from `localStorage`)
- Each task card: task title, short description, model label badge, link to `/tasks/[slug]`
- Cards: interactive hover state, `rounded-xl`, bordered

---

#### Section 7 — Project Snapshot

**Utility:** Surface recent structural or operational highlights for developers and maintainers.

- Muted background container (`bg-muted/30`), `rounded-2xl`, bordered
- Heading + subtitle
- 2-column grid of plain text items, each in a small bordered rounded pill/card
- No interactive elements

---

### Task Workspace Page (`/tasks/[slug]`)

**Utility:** Primary interaction surface for a single AI task. User pastes code or text, submits, and reads the streaming AI response.

#### Section 1 — Shared Navigation Bar

Same as Overview page navigation bar. Active state on current task link if applicable.

---

#### Section 2 — Task Header

**Utility:** Orient the user to which task they are running and what input is expected.

- Task title (large, bold)
- One-line task description (muted)
- Optional: model badge showing which model handles this task

---

#### Section 3 — Input Composer

**Utility:** Accept the user's code or text input and trigger AI execution.

- Large `<textarea>` or code-like input area with monospace font
- Placeholder text describing what to paste (e.g., "Paste your code or diff here…")
- Submit button (primary, full-width or right-aligned)
- Optional: character/token count indicator

---

#### Section 4 — Response Stream

**Utility:** Display the AI-generated output as it streams in, preserving code block formatting.

- Scrollable output area
- Markdown rendering with syntax-highlighted code blocks
- Streaming indicator (animated cursor or loading bar while generating)
- Copy-to-clipboard button on code blocks

---

#### Section 5 — Conversation History (optional, per-task)

**Utility:** Allow users to review prior turns within the same session without losing context.

- Collapsed by default or shown as a thread below the primary response
- Each turn: user input summary + assistant response

---

### Settings Page (`/settings`)

**Utility:** Let users configure which local Ollama model handles each task role.

#### Section 1 — Shared Navigation Bar

Same as other pages.

---

#### Section 2 — Page Header

- Title: "Settings" or "Model Configuration"
- Short description of what can be configured

---

#### Section 3 — Model Assignment Panel

**Utility:** Map each task type and system role to a specific local model pulled from Ollama.

- List or grid of configuration rows, one per role:
  - Analyst model (pre-routing intelligence)
  - Translator model (optional prose translation)
  - One entry per specialist task (explain, error-explain, test, refactor, commit, docstring, naming, dead-code, type-hints, performance-hint)
- Each row: role label, optional description, model selector (dropdown or text input showing the Ollama model name)
- Save / reset controls at the bottom or inline per row
- State persisted to `localStorage` under key `slm-router-model-config`

---

## Visual Design Directives

- **Density:** Medium — not sparse, not cluttered. Favor readable line heights and consistent `gap-4` / `gap-6` spacing.
- **Color role:** Primary color for interactive elements, badges, and numbers. Muted tones for secondary text and backgrounds. Borders at low opacity (`border/60` to `border/70`).
- **Cards:** Consistent use of `bg-card`, subtle border, small shadow. No heavy drop shadows or gradients inside cards.
- **Buttons:** Primary = filled with `bg-primary text-primary-foreground`. Secondary = outlined with `border bg-background`. Both `rounded-lg`, padding `px-5 py-2.5`.
- **Code surfaces:** Monospace font, slightly lower brightness background, no decorative chrome.
- **Motion:** Minimal. Hover transitions only (`transition-colors`, `hover:opacity-90`). No entrance animations.
- **Accessibility:** Sufficient contrast ratios in both themes. Focus-visible rings on interactive elements. Semantic HTML (`<header>`, `<main>`, `<section>`, `<article>`, `<nav>`).
