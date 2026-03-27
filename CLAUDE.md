# Timer App

## Project Overview
This is a standalone focus timer app extracted from a larger shadcn component gallery project. It's a Vite + React + TypeScript app using shadcn/ui components and Tailwind v4.

**GitHub:** https://github.com/jonathanriese/timer_app

---

## Tech Stack
- **Vite** + **React** + **TypeScript**
- **Tailwind v4** — uses `@theme inline` CSS variable bridge (see `src/index.css`)
- **shadcn/ui** components — stored in `src/components/ui/`
- **Lucide React** icons
- **Radix UI** primitives (via shadcn)
- **Geist** variable font via `@font-face` in `src/index.css`

---

## Key Design Decisions

### Tailwind v4 + shadcn CSS variable bridge
shadcn components reference CSS variables like `bg-background`, `text-foreground` etc. Tailwind v4 requires these to be mapped explicitly. This is done in `src/index.css` via an `@theme inline` block:
```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... etc */
}
```

### Color tokens
- Dark mode card: `--card: oklch(0.095 0 0)`
- Border: `--border: oklch(0.3 0 0)`
- Input background: `--input: oklch(1 0 0 / 5%)`
- **Destructive = purple**: `oklch(0.577 0.245 292)` light / `oklch(0.704 0.191 292)` dark — used for selected task highlight and last-5-seconds timer colour

### Radix portal z-index fix
Select/popover dropdowns render in a portal and need this in `index.css`:
```css
[data-radix-popper-content-wrapper] { z-index: 9999 !important; }
```

---

## App Structure

### Entry point
`src/main.tsx` renders `<TimerPage />` directly — no routing needed since this is a single-page app.

### Main component: `src/pages/timer.tsx`
All app state lives here. Key state:

| State | Type | Purpose |
|---|---|---|
| `time` | string | Current time input value (minutes) |
| `defaultTime` | string | Saved default timer duration |
| `defaultBreakTime` | string | Saved break duration (default "5") |
| `timerState` | `"idle" \| "running" \| "paused" \| "done"` | Current phase |
| `remainingSeconds` | number | Countdown value |
| `initialSeconds` | number | Starting value (used by revert button) |
| `isBreak` | boolean | Whether current/last session was a break |
| `tasks` | Task[] | Task list |
| `selectedTaskId` | string \| null | Task dragged into drop zone |
| `settingsOpen` | boolean | Settings dialog open state |

### Timer flow
```
idle → running → paused → running → done → idle
                                  ↓
                            "Take a break?" screen
                            → Start break → running (isBreak=true)
                                          → idle (after break ends)
```

### TaskCard component: `src/components/TaskCard.tsx`
- **Single click** toggles done (220ms delay to distinguish from double-click)
- **Double click** enters inline rename mode
- **Drag** enables HTML5 native drag onto the drop zone (only for undone tasks during idle state)
- **Selected tasks** get a purple (`--destructive`) border
- **Done tasks** have muted label colour, sorted to bottom of list

---

## Features

### Timer
- Configurable duration (default 25 min, adjustable in settings)
- Stop / Resume / Revert / Cancel controls while running
- **Last 5 seconds**: timer digits turn purple (`text-[var(--destructive)]`) with 300ms transition
- **On completion**: 3-note ascending chime via Web Audio API (880 → 1109 → 1320 Hz)

### Break
- "Take a break?" prompt shown after timer finishes
- Configurable break duration (default 5 min, adjustable in settings)
- Header shows "☕ Break time" during break; task list is hidden
- Chime plays when break ends, then returns to idle (no second break prompt)

### Task drag-and-drop
- Tasks are dragged from the list into a drop zone above the Start button
- Drop zone shows task label + ✕ button when filled
- Only undone tasks are draggable, and only in idle state

### Settings dialog
- Opens via the `⋮` (EllipsisVertical) button in the header
- Positioned at the top of the screen (`top-8 translate-y-0`)
- **Default time** — saves immediately on change (no Save button)
- **Break time** — saves immediately on change
- **Dev tools** accordion (collapsible) with a "Skip timer" button that sets remaining to 1s

### Header
Changes with timer state:
- `idle` → "Set timer" with `ChevronsRight` icon
- `running/paused` → selected task label (or "No task selected") with `ChevronsRight` icon
- `running/paused` + `isBreak` → "☕ Break time"
- `done` → "Done" with `Check` icon

---

## Gotchas & Fixes Encountered

### Double-click vs single-click
HTML fires `click` before `dblclick`. TaskCard uses a 220ms timeout that cancels on second click to prevent the first click of a double-click from toggling done state.

### Break chime
The break→idle transition effect runs before the general "done" chime effect. The chime is therefore played directly inside the break→idle effect, with `setTimeout(() => ctx.close(), 2000)` instead of the cleanup function to avoid cutting sound short.

### Dialog top alignment
Radix Dialog centers by default (`top-[50%] translate-y-[-50%]`). Overridden with `top-8 translate-y-0` on the `DialogContent` className — `tailwind-merge` ensures the passed classes win.

### Accordion borders
Default shadcn `AccordionItem` has a bottom border. Removed with `className="border-none"` on the item.
