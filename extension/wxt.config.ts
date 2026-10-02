import { defineConfig } from "wxt";
import { resolve } from "node:path";

// WXT config — builds one codebase into both Chromium (MV3 service_worker) and
// Firefox (MV2 event page) targets. Use `browser.*` everywhere (auto-polyfilled).

function serverOrigin(url: string): string | null {
  try {
    return `${new URL(url).origin}/*`;
  } catch {
    return null;
  }
}

export default defineConfig({
  modules: ["@wxt-dev/module-react"],

  alias: {
    "@shared": resolve(__dirname, "../shared"),
  },

  manifest: ({ manifestVersion, browser }) => {
    const SERVER_ORIGIN = serverOrigin(process.env.WXT_SERVER_URL || "");
    return {
      name: "DAMA Agile Planner",
      description: "Timer, notifications and pinned notes for DAMA Agile Planner",
      permissions:
        manifestVersion === 3 || !SERVER_ORIGIN
          ? ["storage", "alarms", "notifications"]
          : ["storage", "alarms", "notifications", SERVER_ORIGIN],
      ...(manifestVersion === 3 && SERVER_ORIGIN
        ? { host_permissions: [SERVER_ORIGIN] }
        : {}),
      action: {
        default_title: "DAMA Agile Planner",
      },
      ...(browser === "firefox"
        ? {
            browser_specific_settings: {
              gecko: {
                id: "dama-agile-planner@dama-crm.com",
                strict_min_version: "115.0",
              },
            },
          }
        : {}),
    };
  },
});
