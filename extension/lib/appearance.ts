import { browser } from "wxt/browser";

// Popup look & feel, independent of auth state — persisted so it survives
// popup close/reopen (the popup's DOM is destroyed every time it closes).

export type Theme = "dark" | "light";
export type PopupWidth = "default" | "compact" | "wide";

export interface AppearanceSettings {
  theme: Theme;
  width: PopupWidth;
  compact: boolean;
}

const DEFAULTS: AppearanceSettings = {
  theme: "dark",
  width: "default",
  compact: false,
};

const WIDTH_PX: Record<PopupWidth, number> = {
  default: 360,
  compact: 300,
  wide: 420,
};

const KEY = "appearance";

export async function getAppearance(): Promise<AppearanceSettings> {
  const r = await browser.storage.local.get(KEY);
  return { ...DEFAULTS, ...(r[KEY] as Partial<AppearanceSettings>) };
}

export async function setAppearance(
  patch: Partial<AppearanceSettings>,
): Promise<AppearanceSettings> {
  const next = { ...(await getAppearance()), ...patch };
  await browser.storage.local.set({ [KEY]: next });
  return next;
}

// Applies to <html> so it's in effect for every view, including LoginView
// (rendered before a session exists).
export function applyAppearance(a: AppearanceSettings): void {
  document.documentElement.dataset.theme = a.theme;
  document.documentElement.classList.toggle("compact", a.compact);
  document.body.style.width = `${WIDTH_PX[a.width]}px`;
}
