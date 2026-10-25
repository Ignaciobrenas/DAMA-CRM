---
name: light-mode-ux-design
description: >-
  Enterprise Light Mode UI/UX Design System Skill. Use when refining light theme colors, surfaces, contrast, typography, and visual hierarchy across DAMA-CRM, eliminating eye-strain and blinding white washes.
---

# Enterprise Light Mode UI/UX Design Standards (DAMA-CRM)

This skill provides the design foundation for comfortable, warm, anti-glare light theme interfaces inspired by industry benchmarks (Linear, Raycast, Stripe Dashboard, Vercel, Apple Design Guidelines).

---

## 1. The Anti-Glare Philosophy (Combatting "Demasiado Blanco")

Harsh `#FFFFFF` applied uniformly across the canvas, cards, sidebars, and inputs causes severe glare, pupil fatigue, and eliminates surface depth.
High-tier enterprise design solves this through **Layered Surface Elevation**:

| Elevation Layer | Light Mode Palette | CSS / Tailwind Class | Visual Purpose |
| :--- | :--- | :--- | :--- |
| **0. Canvas Base** | Soft Slate/Zinc `#F1F5F9` | `bg-slate-100/90` or `#F1F5F9` | The foundation: warm, comfortable to look at for hours, non-reflective. |
| **1. Primary Cards & Panels** | Pure White or Slate-50 `#FFFFFF` / `#F8FAFC` | `bg-white` or `bg-slate-50/80` with `border border-slate-200/80 shadow-xs` | Stands out with crisp delineation and micro-contrast against the `#F1F5F9` base. |
| **2. Navigation (Sidebar / Topbar)** | Frosted Soft Slate `#F8FAFC` (95% opacity) | `bg-slate-50/95 backdrop-blur-md border-slate-200` | Anchors the interface without blinding the user. |
| **3. Recessed Wells / Tables / Filters** | Subtle Gray `#F1F5F9` to `#E2E8F0` | `bg-slate-100` / `bg-slate-200/60` | Creates intentional depth for table headers, search bars, and filter strips. |
| **4. Modals & Dialogs** | Centered Crisp Surface `#FFFFFF` | `bg-white border border-slate-200 shadow-xl rounded-2xl` | Elevated on top of a dark diffused backdrop (`bg-slate-900/40 backdrop-blur-xs`). |

---

## 2. Palette & Contrast Matrix

```
Canvas Base (#F1F5F9)  ──>  Card Surface (#FFFFFF)  ──>  Border (#E2E8F0)  ──>  Primary Text (#0F172A)
                                                                            ──>  Secondary Text (#475569)
                                                                            ──>  Muted Text (#64748B)
```

- **Avoid**:
  - `html:not(.dark) body { background: #FFFFFF !important; }` or `#FAFAFA` (nearly pure white).
  - Forcing `bg-white` to `#FFFFFF !important` everywhere with invisible borders.
  - Hardcode jumping hover animations (`translateY(-3px) scale(1.02)`) on business CRM elements.
- **Enforce**:
  - Base body: `bg-slate-100/90` (`#F1F5F9`).
  - Subtle borders: `border-slate-200` (`#E2E8F0`) and `border-slate-300` (`#CBD5E1`).
  - Soft ambient shadows: `box-shadow: 0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.05)`.
  - Brand Accent: Solid Royal Blue `#2563EB` (hover: `#1D4ED8`) or Indigo `#4F46E5`.

---

## 3. Typography & Hierarchy (Light Mode)

- **Headings & Metric Numbers**: `text-slate-900 font-bold tracking-tight` (deep charcoal-slate `#0F172A`, never washed out).
- **Body & Table Cells**: `text-slate-700 font-medium` (`#334155`).
- **Secondary Subtitles & Labels**: `text-slate-500 font-normal` (`#64748B`).
- **Muted Hints & Metadata**: `text-slate-400 text-xs` (`#94A3B8`).

---

## 4. Input Fields & Form Controls

- **Standard State**:
  - Background: `#FFFFFF`
  - Border: `1px solid #CBD5E1` (`border-slate-300`)
  - Text: `#0F172A`
  - Placeholder: `#94A3B8`
- **Focus State**:
  - Border: `#2563EB` (`border-blue-600`)
  - Ring: `ring-2 ring-blue-500/20`
  - **No layout shifting** (no jumping `translateY`).

---

## 5. Micro-Interactions & Transitions

- Buttons:
  - Standard hover: subtle darkening of background (`hover:bg-slate-100`, `hover:bg-blue-700`) and slight shadow elevation (`hover:shadow-xs`).
  - Active press: `active:scale-[0.98]` (gentle tactile click, 100ms).
- Dropdowns & Tooltips:
  - Background: `#FFFFFF` with `border border-slate-200/90 shadow-lg rounded-xl`.

---

## 6. Official DAMA-CRM Rules Compliance

1. **Logo Assets**: Never modify or alter `client/public/assets/logos/`.
2. **Modal Positioning**: Modals must remain strictly centered on screen (`fixed inset-0 z-50 flex items-center justify-center p-4 m-auto`).
3. **Spanish Fiscal & LOPDGDD Rules**: Preserve high-contrast legal and financial tables.
