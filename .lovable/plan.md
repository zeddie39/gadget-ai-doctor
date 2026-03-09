

## Problem

The Diagnose page has 12 tabs crammed into a single row (`grid-cols-6 lg:grid-cols-12`), causing overlap and poor readability — especially on smaller screens. The layout looks cluttered and the tabs stack awkwardly as seen in the screenshot (two rows of overlapping pills).

## Plan: Redesign the Diagnose Page Layout

### 1. Reorganize tabs into grouped categories with a two-row layout

Split the 12 tabs into two logical rows instead of forcing them into one grid:

- **Row 1 — Diagnostics:** Photo, Video, AI Chat, Wizard, Battery, Cleaner
- **Row 2 — Insights & Tools:** Health, History, Knowledge, Security, AI Training, Inventory

Use `flex flex-wrap justify-center gap-2` instead of rigid grid columns so tabs flow naturally and breathe.

### 2. Improve the TabsList styling

- Remove the `grid grid-cols-6 lg:grid-cols-12` — replace with `flex flex-wrap justify-center gap-2`
- Add proper `h-auto` to the TabsList so it doesn't constrain height
- Add a subtle section divider or spacing between the two conceptual groups

### 3. Better header layout

- Center-align the title properly with the sign out button using a cleaner flexbox arrangement
- Add the ZTech logo next to the title
- Make the header responsive — stack on mobile

### 4. Improve tab content area

- Add `mt-6` spacing between tabs and content
- Add subtle entrance animation to tab content

### 5. File changes

**`src/pages/Diagnose.tsx`:**
- Change TabsList from `grid grid-cols-6 lg:grid-cols-12` to `flex flex-wrap justify-center gap-2 h-auto`
- Add category labels/dividers between tab groups
- Improve header layout with better responsive alignment
- Add proper spacing and padding

**`src/styles/ui-enhancements.css`:**
- Adjust `[role="tablist"]` to support flex-wrap layout
- Fine-tune nav-pill sizes for better proportions
- Add subtle animation for tab content transitions

