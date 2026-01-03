# Guía de Protección de Ramas y Políticas de CI en GitHub 🛡️

Para garantizar la máxima integridad del código y cumplir con el requerimiento de **bloquear empujes directos a la rama `main`**, DAMA-CRM implementa dos capas de seguridad:

---

## Capa 1: Reglas Nativas de GitHub (Branch Protection Rules)

Para configurar la protección en la interfaz web de GitHub:
1. Navega a **Settings** > **Branches** en el repositorio de GitHub.
2. Haz clic en **Add branch protection rule**.
3. En **Branch name pattern**, escribe `main` (o `master`).
4. Marca las siguientes opciones obligatorias:
   * ✅ **Require a pull request before merging:**
     * Requiere al menos 1 aprobación de revisión de código.
     * Desmarca *Allow specified actors to bypass pull request requirements*.
   * ✅ **Require status checks to pass before merging:**
     * Marca `Core Backend (TypeScript & Prisma Check)`
     * Marca `Client Frontend (TypeScript & Vite Build)`
     * Marca `Build Multi-stage Alpine Images`
   * ✅ **Require branches to be up to date before merging**
   * ✅ **Include administrators:** Aplica las restricciones incluso a los administradores del repositorio.
5. Haz clic en **Save changes**.

---

## Capa 2: Workflows Automatizados de GitHub Actions

El directorio `.github/workflows/` incluye:

| Archivo de Flujo | Propósito | Disparador |
| :--- | :--- | :--- |
| `block-main-push.yml` | Bloquea y aborta cualquier comando `git push origin main` directo. | `push` a `main`/`master` |
| `audit-security.yml` | Ejecuta auditoría de vulnerabilidades con `npm audit` y detecta fugas de secretos o claves `.env`. | `pull_request`, `push` a ramas y semanalmente |
| `lint-and-typecheck.yml` | Valida el tipado TypeScript tanto en el Backend (`core`) como en el Frontend (`client`), asegurando cero regresiones. | `push` a ramas `feature/**` y `pull_request` |
| `docker-build-check.yml` | Construye las imágenes Docker multi-stage Alpine para certificar que el contenedor de producción es desplegable. | `pull_request` |

---

## 🚀 Flujo de Trabajo para Desarrolladores

```bash
# 1. Crear nueva rama a partir de master/main
git checkout -b feature/nombre-de-tu-funcionalidad

# 2. Realizar cambios y crear commits con firma
git add .
git commit -m "feat(modulo): descripcion de la mejora"

# 3. Subir la rama a GitHub
git push origin feature/nombre-de-tu-funcionalidad

# 4. Abrir Pull Request en GitHub hacia la rama main
# El CI ejecutará automáticamente las comprobaciones de lint, types y auditoría.
```
