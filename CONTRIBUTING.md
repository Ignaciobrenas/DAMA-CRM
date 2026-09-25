# Normas de Contribución y Desarrollo en DAMA-CRM 📋

Bienvenido a la guía de desarrollo y estándares de código de **DAMA-CRM**. Para mantener la alta calidad, escalabilidad y accesibilidad de la plataforma, todas las contribuciones deben seguir rigurosamente estas pautas.

---

## 🌐 1. Norma Estricta de Internacionalización (i18n)

> [!CAUTION]
> **Prohibido el uso de textos planos hardcodeados en el código.**
> Cualquier pull request o commit que introduzca cadenas de texto visibles para el usuario en JSX/TSX sin utilizar el hook `t('clave')` será rechazado.

### Cómo trabajar con i18n:
1. **Registrar la clave** en [`client/src/i18n/index.ts`](client/src/i18n/index.ts) tanto en el diccionario `es` como en `en`.
2. **Consumir la clave** en el componente:
   ```tsx
   import { useLanguage } from '../context/LanguageContext';

   export const MiComponente = () => {
     const { t } = useLanguage();
     return <button>{t('miClave')}</button>;
   };
   ```
3. Si un texto dinámico requiere interpolación, estructúralo de forma modular o añade la clave correspondiente.

---

## 🛡️ 2. Seguridad y Permisos (RBAC)
- Todas las operaciones de mutación (crear, editar, eliminar) deben estar protegidas en el backend con `requirePermission(resource, action)`.
- En el frontend, todos los botones de acción deben estar envueltos en `<PermissionGate resource="..." action="...">`.

---

## 🪟 3. Modales y Pop-ups
- Todo diálogo modal debe utilizar el componente unificado `<Modal>` de [`client/src/components/common/Modal.tsx`](client/src/components/common/Modal.tsx).
- Todo menú desplegable o drawer debe implementar escucha de tecla `Escape`, bloqueo de scroll de fondo y cierre al hacer clic fuera del contenedor.

---

## 🧪 4. Pruebas y Compilación
Antes de enviar cambios o realizar un commit:
```bash
npm --prefix client run build
npm --prefix core run build
npm --prefix core test
```
Ambos builds deben completarse con 0 errores y el 100% de la suite de pruebas debe pasar satisfactoriamente.
