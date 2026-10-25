// Default DAMA-CRM Backend API URL & Web App URL.
// Can also be customized at runtime in the extension Settings / Login view.
export const DEFAULT_SERVER_URL = (
  (import.meta.env.WXT_SERVER_URL as string | undefined) ||
  "http://localhost:3000"
).replace(/\/$/, "");

export const DEFAULT_WEB_URL = (
  (import.meta.env.WXT_WEB_URL as string | undefined) ||
  "http://localhost:5173"
).replace(/\/$/, "");

export const SERVER_URL = DEFAULT_SERVER_URL;
export const WEB_URL = DEFAULT_WEB_URL;
