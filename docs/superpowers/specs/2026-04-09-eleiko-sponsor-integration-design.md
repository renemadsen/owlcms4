# Eleiko Sponsor Integration — Header Co-Branding

**Date:** 2026-04-09
**Approach:** A — Header Co-Branding ("Powered by ELEIKO")

## Summary

Add Eleiko as main sponsor across all DVF display types using a consistent "Powered by ELEIKO" badge placed on the right side of every header bar, opposite the DVF logo. The badge uses a white background with black ELEIKO text for contrast against the dark blue headers.

## Design

### Badge Markup

Every header bar that currently contains the DVF logo gets an Eleiko badge on the right side:

```
[DVF logo] [Event title] [Group info]  ···  [Powered by] [ELEIKO]
```

- "Powered by" text: `rgba(255,255,255,0.4)`, 8px uppercase, letter-spacing 1px
- ELEIKO badge: white background, black text, 800 weight, 11px, letter-spacing 2px, border-radius 3px, padding 2px 8px

### Displays to Modify

| Display | Component File | Placement |
|---------|---------------|-----------|
| Results Scoreboard | `Results.js` line 29-33 | Right side of `.header-bar` |
| Lifting Order | `Results.js` (shared template) | Same header bar |
| Current Athlete | `CurrentAthlete.js` line 27-28 | End of `.lt-bar`, after timer, separated by divider |
| Top Sinclair | `TopSinclair.js` lines 28-29, 79-80 | Right side of `.tb-header` (both women/men cards) |
| Attempt Board | `AttemptBoard.js` | New header bar above existing grid (currently has no header) |
| Decision Board | `DecisionBoard.js` | New header bar above octagon display |
| Medals | `ResultsMedals.js` | Right side of header bar |
| Start List | `ResultsStartList.js` | Right side of header bar |

### Asset Required

An Eleiko logo image file (`eleiko-logo-white.png` or similar) placed in `shared/src/main/resources/logos/`. Alternatively, use text-only "ELEIKO" in a white badge (as shown in mockups), which requires no image file.

**Recommendation:** Use text-only badge. Eleiko's wordmark is simple enough that styled text is indistinguishable from the logo at these sizes, and avoids needing to source/license an image file.

### CSS Changes

No new CSS files needed. The badge styling is inline in the component templates, consistent with the existing DVF logo placement pattern. The header bars already use flexbox with `justify-content: space-between`, so adding the right-side badge is straightforward.

### Current Athlete Lower-Third Special Case

The lower-third overlay has limited horizontal space. The Eleiko badge goes at the far right of `.lt-bar`, separated from the timer by a subtle vertical divider (`border-left: 1px solid rgba(255,255,255,0.2); padding-left: 10px`). The badge is slightly smaller here (10px font).

### Attempt Board / Decision Board Special Case

These displays currently have no header bar. A thin header bar will be added above the existing content, matching the style used in Results/TopSinclair. The attempt board grid's `height: 100vh` will need adjustment to `calc(100vh - header-height)` to accommodate the new header.

## Out of Scope

- Animated sponsor transitions
- Multiple sponsor rotation
- Sponsor placement in waiting/idle screens
- Eleiko branding on jury/admin displays
