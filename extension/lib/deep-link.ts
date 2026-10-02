// Build an absolute URL into the dama-agile-planner web app from a notification's
// `actionUrl` against the configured server base URL. Falls back to the
// server root when no actionUrl is present.
export function buildDeepLink(
  serverUrl: string | null,
  actionUrl?: string | null,
): string | null {
  if (!serverUrl) return null;
  const base = serverUrl.replace(/\/$/, "");
  if (!actionUrl) return base || null;

  // `actionUrl` is sometimes already absolute (server/lib/url-helper.ts builds
  // it from APP_URL for email links), which can point at a different
  // host/port than this extension's configured server. Always re-target the
  // path onto the extension's own server rather than trusting that host.
  let path = actionUrl;
  if (/^https?:\/\//i.test(actionUrl)) {
    try {
      const u = new URL(actionUrl);
      path = `${u.pathname}${u.search}${u.hash}`;
    } catch {
      return actionUrl;
    }
  }
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

// Same host-retargeting as buildDeepLink, but for asset paths (e.g. a user's
// avatar) that should render as <img src>. Returns undefined instead of the
// server root when there's no asset, so callers can fall back to initials.
export function buildAssetUrl(
  serverUrl: string | null,
  assetPath?: string | null,
): string | undefined {
  if (!serverUrl || !assetPath) return undefined;
  const base = serverUrl.replace(/\/$/, "");

  let path = assetPath;
  if (/^https?:\/\//i.test(assetPath)) {
    try {
      const u = new URL(assetPath);
      path = `${u.pathname}${u.search}`;
    } catch {
      return assetPath;
    }
  }
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
