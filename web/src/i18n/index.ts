import type { Translations } from "./types";
import { en } from "./en";
import { zhTW } from "./zh-TW";

/**
 * Registering a new language is exactly two edits to this file:
 *   1. import it
 *   2. add one entry each to DICTIONARIES and SUPPORTED_LOCALES
 * Nothing else in the app needs to know a new language exists.
 */
export type Locale = "en" | "zh-TW";

export const SUPPORTED_LOCALES: ReadonlyArray<{ code: Locale; label: string }> = [
  { code: "en", label: "EN" },
  { code: "zh-TW", label: "中文" },
];

const DICTIONARIES: Record<Locale, Translations> = {
  en,
  "zh-TW": zhTW,
};

const STORAGE_KEY = "archlens-docsgap:locale";

function isSupportedLocale(value: string | null): value is Locale {
  return value === "en" || value === "zh-TW";
}

function detectInitialLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isSupportedLocale(saved)) return saved;
  } catch {
    // localStorage can throw in privacy/incognito modes — fall back silently.
  }
  return "en";
}

let currentLocale: Locale = detectInitialLocale();
const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  return currentLocale;
}

export function getTranslations(): Translations {
  return DICTIONARIES[currentLocale];
}

export function setLocale(locale: Locale): void {
  if (locale === currentLocale) return;
  currentLocale = locale;
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore — language choice just won't persist across reloads
  }
  document.documentElement.lang = locale === "zh-TW" ? "zh-Hant" : "en";
  listeners.forEach((fn) => fn(locale));
}

/** Called by main.ts to re-render whatever depends on the active language. */
export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function resolvePath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) return (acc as Record<string, unknown>)[key];
    return undefined;
  }, obj);
}

/**
 * Applies the current dictionary to every element with a `data-i18n="a.b.c"`
 * attribute (path into the Translations object), plus <title> and the meta
 * description tag. Call once on load and again after setLocale().
 */
export function applyStaticTranslations(root: ParentNode = document): void {
  const dict = getTranslations();
  root.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const value = resolvePath(dict, el.getAttribute("data-i18n")!);
    if (typeof value === "string") el.textContent = value;
  });

  document.title = dict.meta.title;
  document.querySelector('meta[name="description"]')?.setAttribute("content", dict.meta.description);
  document.documentElement.lang = currentLocale === "zh-TW" ? "zh-Hant" : "en";
}
