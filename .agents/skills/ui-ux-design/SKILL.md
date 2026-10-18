---
name: ui-ux-design
description: >-
  Comprehensive guide and procedures for crafting world-class modern UI/UX design, visual hierarchy,
  color theory, typography systems, responsive layouts, and accessibility across DAMA-CRM.
---

# Modern UI/UX Design System Guide

This skill equips the agent with design principles, color theory, typography, spacing, and component styling rules to deliver award-winning, visually striking interfaces (Linear / Stripe / Vercel quality).

---

## 1. Visual Hierarchy & Spatial Layout

- **60-30-10 Color Rule:**
  - **60% Dominant Background:** Light: Warm Slate Canvas (`#F1F5F9`). Dark: Deep Obsidian (`#090D16` / `#020617`).
  - **30% Secondary Elements:** Cards, panels, sidebars (`#FFFFFF` with crisp `border-slate-200/80` in light; `#0F172A` with `border-slate-800` in dark).
  - **10% Accent / Brand Pop:** Electric Blue (`#2563EB`), Emerald Green (`#10B981`), Amber (`#F59E0B`), Rose (`#F43F5E`).
- **Whitespace & Rhythm:**
  - Use an 8pt grid system for padding/margin (`p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`).
  - Standard container max-width: `max-w-7xl mx-auto`.

---

## 2. Typography Strategy

- **Font Family:** Inter / Plus Jakarta Sans.
- **Headings (H1, H2, H3):** Bold/Semibold weight, tight letter-spacing (`tracking-tight`), high-contrast dark text (`text-slate-900` light / `text-slate-100` dark).
- **Body & Content:** High-legibility (`text-slate-700` light / `text-slate-300` dark), `leading-relaxed`.
- **Badges & Tags:** Semibold or bold, uppercase text with soft tinted backgrounds (`bg-blue-50 text-blue-700 border border-blue-200` in light).

---

## 3. Micro-interactions & Tactile Feedback

- **Hover States:**
  - Elevate cards subtly with `shadow-sm` or `border-slate-300`.
  - Buttons: Smooth background shade transition (`duration-150 ease-out`).
- **Active / Press States:**
  - Tactile spring feedback: `active:scale-[0.98]`.
- **Transitions:**
  - Standard duration: `150ms` to `200ms` with `ease-out`. Avoid jarring, disorienting jump animations on business tools.

---

## 4. Accessibility (WCAG 2.1 AA)

- Minimum contrast ratio of **4.5:1** for regular body text and **3:1** for large text.
- Visible focus rings (`focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none`).
- High-contrast inputs and labels for effortless legibility.
