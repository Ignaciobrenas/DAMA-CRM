import { defineConfig } from "wxt";

// WXT config — builds one codebase into both Chromium (MV3 service_worker) and
// Firefox (MV2/Gecko) targets.

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  manifest: ({ manifestVersion, browser }) => {
    const hostPerms = [
      "http://localhost/*",
      "http://127.0.0.1/*",
      "https://*.damacrm.com/*",
      "https://*.dama.com/*",
    ];

    return {
      name: "DAMA-CRM — Harvest Timer & Fichaje Horario",
      short_name: "DAMA Timer",
      description:
        "Extensión oficial de DAMA-CRM para Chrome y Firefox: Timer estilo Harvest, fichaje horario persistente en servidor, tareas y notificaciones.",
      permissions:
        manifestVersion === 3
          ? ["storage", "alarms", "notifications"]
          : ["storage", "alarms", "notifications", ...hostPerms],
      ...(manifestVersion === 3 ? { host_permissions: hostPerms } : {}),
      action: {
        default_title: "DAMA-CRM — Harvest Timer & Fichaje",
      },
      ...(browser === "firefox"
        ? {
            browser_specific_settings: {
              gecko: {
                id: "harvest-timer@dama-crm.com",
                strict_min_version: "115.0",
              },
            },
          }
        : {}),
    };
  },
});
