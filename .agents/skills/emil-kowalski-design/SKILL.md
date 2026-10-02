---
name: emil-kowalski-design
description: >-
  Emil Kowalski UI/UX & Design Engineering Skill. Use when designing, refactoring, or polishing user interfaces, animations, micro-interactions, dark/light theme palettes, typography, buttons, modals, and components across DAMA-CRM.
---

# Emil Kowalski UI & Design Engineering Guidelines

This skill encapsulates the high-standard design engineering principles created by Emil Kowalski (Design Engineer at Vercel), tailored specifically to DAMA-CRM.

---

## Core Visual & Interactive Principles

### 1. Typography & Content Hierarchy
- **Primary Text**: `text-slate-900 dark:text-slate-100 font-semibold tracking-tight`
- **Secondary Text**: `text-slate-500 dark:text-slate-400 text-sm font-normal`
- **Subtle Captions & Badges**: `text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500`
- **Leading & Kerning**: Use tight letter-spacing (`tracking-tight`) for display headers (`text-xl`, `text-2xl`, `text-3xl`).

### 2. Palette & Contrast (DAMA-CRM Light & Dark Standards)
- **Light Mode Screen Background**: Soft Slate/Zinc (`bg-slate-100/90`), avoiding harsh `#FFFFFF` screen backgrounds.
- **Card & Surface Backgrounds**: `bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md transition-all`
- **Subtle Containers / Pill Backgrounds**: `bg-slate-50 dark:bg-slate-800/60`
- **Primary Action Color**: Premium Blue/Indigo gradient or solid (`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/25`)

### 3. Micro-Interactions & Spring Physics (Framer Motion)
- **Interactive Button Click Feedback**: `active:scale-[0.98] transition-transform duration-100 ease-out`
- **Framer Motion Dialog Transitions**:
  ```tsx
  initial={{ opacity: 0, scale: 0.96, y: 8 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.96, y: 8 }}
  transition={{ type: "spring", stiffness: 450, damping: 30 }}
  ```
- **Hover Transitions**: Smooth 150ms-200ms transitions on backgrounds, text colors, and borders (`transition-all duration-200 ease-out`).

### 4. Modal & Popup Layout Rules (Inmutable DAMA-CRM Rule)
- **Centering**: ALL modals, popups, and dropdown overlays MUST be strictly centered on the screen:
  `fixed inset-0 z-50 flex items-center justify-center p-4 m-auto bg-black/60 backdrop-blur-xs`
- **Border Radius**: Round 2xl or 3xl (`rounded-2xl` / `rounded-3xl`).
- **Header Structure**: Icon + Title + Subtitle + Close Button (`X` icon with hover background).

### 5. Form Elements & Inputs
- **Inputs & Selects**:
  `px-3.5 py-2 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-slate-400`
- **Labels**: `block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5`

### 6. Empty States & Feedback Elements
- **Empty States**: Centered icon inside a soft rounded container (`w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400`), accompanied by a clear title and helpful secondary description.
- **Loading Skeletons**: Animated pulse blocks (`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-lg`).
