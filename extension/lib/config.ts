// Server URL baked in at build time (see .env.example: WXT_SERVER_URL) — one
// build of this extension per dama-agile-planner deployment, so the user never sees
// or types a server address. wxt.config.ts reads the same variable to grant
// it as a host_permission upfront, so there's no runtime permission prompt.
export const SERVER_URL = (
  (import.meta.env.WXT_SERVER_URL as string | undefined) ?? ""
).replace(/\/$/, "");
