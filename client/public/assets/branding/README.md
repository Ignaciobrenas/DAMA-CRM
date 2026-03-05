# 🎨 Carpeta de Assets, Logos e Identidad de Marca DAMA-CRM

Esta carpeta está reservada para alojar los logotipos, iconos e isotipos de tu empresa para personalizar el CRM (Marca Blanca).

---

## 📁 Estructura de Archivos Recomendada

```text
client/public/assets/
├── logos/
│   ├── logo-dama-blue.svg        <- Logotipo predeterminado principal
│   ├── logo-dama-white.svg       <- Versión para temas oscuros / fondos oscuros
│   ├── sample-company-logo.svg   <- Plantilla de ejemplo de logo de empresa
│   └── mi-empresa-logo.png       <- ¡Coloca aquí el logo de tu empresa!
└── branding/
    └── README.md                 <- Esta guía de uso
```

---

## 📐 Especificaciones y Tamaños Recomendados

| Elemento | Formato Recomendado | Dimensiones Óptimas | Uso |
| :--- | :--- | :--- | :--- |
| **Isotipo / Icono Cuadrado** | `.svg` o `.png` transparente | 512 x 512 px | Menú lateral (Sidebar) y PWA Icon |
| **Logotipo Horizontal** | `.svg` o `.png` transparente | 400 x 100 px (o ratio 4:1) | Pantalla de Login y Portal Cliente |
| **Favicon de Navegador** | `.svg` o `.ico` | 32 x 32 px | Pestaña de navegador web |

---

## 🚀 Cómo usar tu propio Logo en DAMA-CRM

Tienes 2 opciones inmediatas:

### Opción A: Desde la interfaz web (Sin tocar código)
1. Entra a **Ajustes** (`/settings`).
2. En la sección **Identidad de Marca & Logo Corporativo**:
   - Haz clic en **"Subir archivo de imagen local"** y selecciona el logo desde tu ordenador.
   - O bien escribe la ruta: `/assets/logos/mi-empresa-logo.png`.
3. Haz clic en **"Guardar Marca"**.
4. ¡Listo! El logo se reflejará instantáneamente en toda la plataforma.

### Opción B: Reemplazo directo en disco
1. Guarda tu logo como `client/public/assets/logos/logo.png` o `logo.svg`.
2. En la pantalla de Ajustes, indica `/assets/logos/logo.png` como URL.
