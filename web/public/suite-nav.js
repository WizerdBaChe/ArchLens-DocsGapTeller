/**
 * <suite-nav> — ArchLens 系列共用導覽列（Phase 3 / 反孤島）正本。
 *
 * 來源（單一事實來源）：D:\AIWork\ArchLens_Series\packages\ui\suite-nav.js
 * 框架無關的 Web Component（Shadow DOM 樣式隔離），可掛在任何產品（React 或 vanilla）。
 * 各產品「vendor」一份到自己的 public/ 並在 index.html 掛載：
 *
 *   <script type="module" src="./suite-nav.js"></script>
 *   <suite-nav current="web"></suite-nav>
 *
 * 屬性：
 *   current      必填，目前產品 id（web / dependency / diff / docsgap）。
 *   manifest-url 選填，指向 suite-manifest.json；提供時以它覆寫內建 registry，
 *                讓導覽列跟著系列單一事實來源走（hub 發佈後可用 raw/CDN URL）。
 *
 * 內建 registry 是 fallback，讓產品即使離線 / hub 尚未發佈也能單獨運作。
 * 新增產品：改 packages/ui 這份正本（或改用 manifest-url），再同步各產品副本。
 */

const FALLBACK = {
  suite: "ArchLens",
  stages: ["understand", "analyze", "compare", "verify"],
  products: [
    { id: "web", name: "Web", stage: "understand", url: "https://wizerdbache.github.io/ArchLens-Web/" },
    { id: "dependency", name: "Dependency", stage: "analyze", url: "https://wizerdbache.github.io/ArchLens-DependencyTeller/" },
    { id: "diff", name: "Diff", stage: "compare", url: "https://wizerdbache.github.io/ArchLens-DiffTeller/" },
    { id: "docsgap", name: "DocsGap", stage: "verify", url: "https://wizerdbache.github.io/ArchLens-DocsGapTeller/" },
  ],
};

const STAGE_LABEL = {
  understand: "看結構",
  analyze: "找相依",
  compare: "比差異",
  verify: "查文件",
};

class SuiteNav extends HTMLElement {
  static get observedAttributes() {
    return ["current", "manifest-url"];
  }

  connectedCallback() {
    this.attachShadow({ mode: "open" });
    this._model = FALLBACK;
    this._render();
    const url = this.getAttribute("manifest-url");
    if (url) this._loadManifest(url);
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this._render();
  }

  async _loadManifest(url) {
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) return;
      const m = await res.json();
      if (!m || !Array.isArray(m.products)) return;
      this._model = {
        suite: m.suite || FALLBACK.suite,
        stages: Array.isArray(m.stages) ? m.stages : FALLBACK.stages,
        // 只取導覽需要的欄位；name 去掉 "ArchLens " 前綴以省空間
        products: m.products.map((p) => ({
          id: p.id,
          name: (p.name || p.id).replace(/^ArchLens\s+/i, ""),
          stage: p.stage,
          url: p.url,
        })),
      };
      this._render();
    } catch {
      /* 保留 fallback */
    }
  }

  _nextProduct(model, currentId) {
    const cur = model.products.find((p) => p.id === currentId);
    if (!cur) return null;
    const idx = model.stages.indexOf(cur.stage);
    if (idx === -1 || idx >= model.stages.length - 1) return null;
    const nextStage = model.stages[idx + 1];
    return model.products.find((p) => p.stage === nextStage) || null;
  }

  _render() {
    const model = this._model;
    const current = this.getAttribute("current") || "";
    const next = this._nextProduct(model, current);

    const tabs = model.products
      .map((p) => {
        const active = p.id === current;
        return `<a class="tab${active ? " active" : ""}"${active ? ' aria-current="page"' : ""}
                   href="${p.url}"${active ? "" : ' target="_blank" rel="noopener"'}>${p.name}</a>`;
      })
      .join("");

    const nextHtml = next
      ? `<a class="next" href="${next.url}" target="_blank" rel="noopener">
           下一步 · ${next.name}<span class="hint">${STAGE_LABEL[next.stage] || ""}</span>
           <span class="arrow">→</span>
         </a>`
      : `<span class="next done">流程末端 ✓</span>`;

    this.shadowRoot.innerHTML = `
      <style>
        :host { all: initial; display: block; }
        .bar {
          box-sizing: border-box; width: 100%;
          display: flex; align-items: center; gap: 16px;
          padding: 8px 16px; min-height: 40px;
          background: #0d0d0f; border-bottom: 1px solid #2a2a30;
          font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Consolas, monospace;
          font-size: 12px; color: #8a8a96;
        }
        .brand { display: flex; align-items: center; gap: 8px; color: #39ff6a; letter-spacing: .15em; text-transform: uppercase; font-weight: 700; white-space: nowrap; }
        .brand .dot { width: 7px; height: 7px; border-radius: 50%; background: #39ff6a; box-shadow: 0 0 6px #39ff6a; }
        .tabs { display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap; }
        .tab { text-decoration: none; color: #8a8a96; padding: 4px 10px; border-radius: 6px; border: 1px solid transparent; transition: all .12s; white-space: nowrap; }
        .tab:hover { color: #e6e6ea; border-color: #2a2a30; }
        .tab.active { color: #0d0d0f; background: #39ff6a; font-weight: 700; }
        .next { display: flex; align-items: center; gap: 8px; text-decoration: none; color: #e6e6ea; padding: 4px 12px; border-radius: 6px; border: 1px solid #2a2a30; white-space: nowrap; transition: all .12s; }
        .next:hover { border-color: #39ff6a; color: #39ff6a; }
        .next .hint { color: #8a8a96; }
        .next:hover .hint { color: #39ff6a; }
        .next .arrow { color: #39ff6a; }
        .next.done { color: #8a8a96; border-style: dashed; }
        .tab:focus-visible, .next:focus-visible { outline: 2px solid #39ff6a; outline-offset: 2px; border-radius: 6px; }
        @media (max-width: 560px) { .next .hint { display: none; } }
      </style>
      <nav class="bar" aria-label="ArchLens suite navigation">
        <span class="brand"><span class="dot"></span>${model.suite}</span>
        <span class="tabs">${tabs}</span>
        ${nextHtml}
      </nav>
    `;
  }
}

if (!customElements.get("suite-nav")) {
  customElements.define("suite-nav", SuiteNav);
}
