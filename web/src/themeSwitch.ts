/**
 * 主題切換器（Phase 4 / @archlens/tokens）— vanilla TS。
 * 切換掛在 <html> 的 .al-theme-* class，共用 token 與本地 caution 色一起換色。
 *
 * 系列慣例：**預設＝Light，且不持久化**——切換只在當次 session 生效，不寫 localStorage；
 * 重新載入即重置回 Light（隱私優先）。index.html 已靜態掛 al-theme-light。
 */

const THEMES = [
  { id: "light", label: "Light" },
  { id: "blueprint", label: "Blueprint" },
  { id: "hacker", label: "Hacker" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"];

const CLASSES = THEMES.map((t) => `al-theme-${t.id}`);

/** 把切換器掛進指定容器（預設 #themeSwitch）。預設選 Light，不讀寫 localStorage。 */
export function initThemeSwitch(container: HTMLElement | null): void {
  if (!container) return;

  let current: ThemeId = "light";
  const buttons = new Map<ThemeId, HTMLButtonElement>();

  const apply = (next: ThemeId) => {
    const el = document.documentElement;
    el.classList.remove(...CLASSES);
    el.classList.add(`al-theme-${next}`);
    current = next;
    buttons.forEach((btn, id) => {
      const active = id === current;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  };

  for (const t of THEMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-switch__btn";
    btn.textContent = t.label;
    btn.addEventListener("click", () => apply(t.id));
    buttons.set(t.id, btn);
    container.appendChild(btn);
  }

  apply(current);
}
