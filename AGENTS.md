# REGLAS OFICIALES DE DESARROLLO - DAMA-CRM

## 1. Identidad Visual & Logotipos Obligatorios
- **UBICACIÓN INMUTABLE DE LOGOS**: Todos los logotipos del proyecto están en `client/public/assets/logos/`.
- **ARCHIVOS OFICIALES QUE NUNCA DEBEN BORRARSE NI CAMBIARSE**:
  - `dama-symbol-dark.png` (Símbolo en fondo oscuro / modo claro)
  - `dama-symbol-white.png` (Símbolo en fondo blanco / modo oscuro)
  - `dama-symbol-color.png` (Símbolo a color)
  - `dama-logo-dark.png` (Logo completo oscuro)
  - `dama-logo-white.png` (Logo completo blanco)
  - `dama-logo-color.png` (Logo completo a color)
  - `dama-logo-black.png` (Logo monocromo negro)
  - `dama-logo-vertical-dark.png` (Logo vertical oscuro)
  - `dama-logo-vertical-white.png` (Logo vertical blanco)
  - `sample-company-logo.svg`
- **PROHIBICIÓN ESTRICTA**: NUNCA borrar, renombrar, reemplazar ni regenerar estos logotipos. Toda la plataforma debe consumir estrictamente estos assets.

## 2. Paleta de Modo Claro
- El modo claro debe usar una **escala de grises suave y agradable** (Slate/Zinc: `#F1F5F9` / `bg-slate-100/90`), evitando pantallas o fondos blancos cegadores (`#FFFFFF` absoluto en todo el fondo).
- Las tarjetas, modales y paneles deben contrastar con bordes sutiles `border-slate-200` y sombras suaves.

## 3. Posicionamiento de Modales y Popups
- **TODOS LOS MODALES Y POPUPS** (Selector de idioma, God Mode / Multi-tenant, Onboarding Tour, Fichaje de jornada / ClockWidget, Perfil de usuario, etc.) deben posicionarse **SIEMPRE EN EL CENTRO EXACTO DE LA PANTALLA** (`fixed inset-0 flex items-center justify-center p-4 m-auto`).
- Queda prohibido posicionar modales o popups pegados a la parte superior de la pantalla (`top-0`, `items-start`, banners invasivos superiores).
