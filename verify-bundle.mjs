// verify-bundle.mjs — 模拟浏览器执行 lib/client.js，校验插件形状、注入的 CSS、
// referrer 处理，以及设置页 URL 成功/失败流程。
import { readFileSync } from "node:fs";
import vm from "node:vm";

const SRC_PATH = "E:/dsh_workspace/dsh-whale-background/lib/client.js";
const src = readFileSync(SRC_PATH, "utf8");

const checks = [];
function check(name, ok) {
  checks.push({ name, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);
}

function makeDocument(tags) {
  return {
    querySelector(selector) {
      const isStyle = selector.includes("style[data-plugin-css=");
      const isMeta = selector.includes("meta[data-plugin-css=");
      const target = isStyle ? "STYLE" : isMeta ? "META" : null;
      const match = selector.match(/data-plugin-css="([^"]+)"/);
      const id = match ? match[1] : null;
      if (!target || !id) return null;
      return tags.find((t) => t.tagName === target && t.dataset && t.dataset.pluginCss === id) || null;
    },
    createElement(tag) {
      const el = {
        tagName: String(tag).toUpperCase(),
        dataset: {},
        style: {},
        textContent: "",
        children: [],
        remove() {
          const i = tags.indexOf(el);
          if (i >= 0) tags.splice(i, 1);
        },
        appendChild(child) {
          el.children.push(child);
          return child;
        },
      };
      return el;
    },
    head: {
      appendChild(child) {
        tags.push(child);
        return child;
      },
    },
  };
}

function createHarness(initialSettings) {
  const tags = [];
  const storage = new Map();
  let sandbox;
  let loaded = null;

  class FakeImage {
    constructor() {
      this._src = "";
      this.referrerPolicy = "";
    }
    set src(value) {
      this._src = value;
      const result = sandbox.__imageResult || "success";
      if (result === "success") {
        if (typeof this.onload === "function") this.onload();
      } else if (typeof this.onerror === "function") {
        this.onerror();
      }
    }
    get src() {
      return this._src;
    }
  }

  const localStorage = {
    getItem(key) {
      return storage.has(key) ? storage.get(key) : null;
    },
    setItem(key, value) {
      storage.set(key, String(value));
    },
    removeItem(key) {
      storage.delete(key);
    },
  };

  sandbox = {
    window: { __ModuleLoader__: { load: (p) => { loaded = p; } } },
    document: makeDocument(tags),
    localStorage,
    Image: FakeImage,
    __imageResult: "success",
  };

  if (initialSettings) {
    localStorage.setItem("dsh-whale-background", JSON.stringify(initialSettings));
  }

  // 极简 React hooks stub，仅用于渲染设置页组件并模拟交互。
  let hookStates = [];
  let hookCursor = 0;
  const reactStub = {
    createElement(type, props) {
      const children = Array.prototype.slice.call(arguments, 2);
      const finalProps = Object.assign({}, props);
      if (children.length === 1) finalProps.children = children[0];
      else if (children.length > 1) finalProps.children = children;
      return { type, props: finalProps, children };
    },
    useState(initial) {
      const i = hookCursor++;
      if (hookStates[i] === undefined) {
        hookStates[i] = typeof initial === "function" ? initial() : initial;
      }
      const set = (value) => {
        hookStates[i] = typeof value === "function" ? value(hookStates[i]) : value;
      };
      return [hookStates[i], set];
    },
    useRef(initial) {
      const i = hookCursor++;
      if (hookStates[i] === undefined) hookStates[i] = { current: initial };
      return hookStates[i];
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: "client.js" });

  const mod = loaded.factory((id) => {
    if (id === "react") return reactStub;
    throw new Error(`unexpected require: ${id}`);
  });

  const registered = { component: null };
  const ctx = {
    effect() {},
    locale: {
      register() {},
      bind() {
        return (key) => key;
      },
    },
    slots: {
      inject(name, fn) {
        if (name === "settings.section") fn();
      },
      register(opts, Comp) {
        registered.component = Comp;
        return opts;
      },
    },
  };

  return {
    sandbox,
    tags,
    storage,
    mod,
    loadedId: loaded && loaded.id,
    ctx,
    registered,
    render() {
      hookCursor = 0;
      return registered.component({ t: (key) => key });
    },
    getSaved() {
      const raw = storage.get("dsh-whale-background");
      return raw ? JSON.parse(raw) : null;
    },
  };
}

function walk(node, fn) {
  if (!node || typeof node !== "object") return;
  fn(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) walk(child, fn);
  }
}

function findBy(tree, predicate) {
  let found = null;
  walk(tree, (node) => {
    if (!found && predicate(node)) found = node;
  });
  return found;
}

function findTextInput(tree) {
  return findBy(tree, (n) => n.props && n.props.type === "text" && typeof n.props.onChange === "function");
}

function findApplyButton(tree) {
  return findBy(tree, (n) => n.props && n.props.type === "button" && typeof n.props.onClick === "function");
}

function findNotice(tree, text) {
  return findBy(tree, (n) => n.props && n.props.children === text);
}

function getStyleCss(harness) {
  const style = harness.tags.find((t) => t.tagName === "STYLE");
  return style ? style.textContent : "";
}

function getReferrerMetas(harness) {
  return harness.tags.filter((t) => t.tagName === "META" && t.name === "referrer" && t.content === "no-referrer");
}

// ---------- 1. 默认加载 ----------
{
  const h = createHarness(undefined);
  check("load called with id dsh-whale-background", h.loadedId === "dsh-whale-background");
  check("exports apply/inject are functions", typeof h.mod.apply === "function" && Array.isArray(h.mod.inject));

  const css = getStyleCss(h);
  check("style injected once", h.tags.filter((t) => t.tagName === "STYLE").length === 1);
  check("default wallpaper data uri present", css.includes("data:image/jpeg;base64,"));
  check("light: centered contain", css.includes("background-size: contain!important") && css.includes("background-position: center!important"));
  check("light: white sides", css.includes("background-color:#ffffff!important"));
  check("light: frosted surface .6", css.includes("rgba(255,255,255,0.6)"));
  check("dark: right poster kept", css.includes("right center") && css.includes("rgba(12,15,23,0.6)"));
  check("dark: own bg color", css.includes("background-color:#0b1020!important"));
  check("default: no referrer meta", getReferrerMetas(h).length === 0);
}

// ---------- 2. 已保存远程 URL：初始化即注入 no-referrer ----------
{
  const h = createHarness({ image: "https://img.example.com/a.png", surfaceOpacity: 0.6, mode: "cover" });
  const css = getStyleCss(h);
  check("persisted remote URL in css", css.includes('url("https://img.example.com/a.png")'));
  check("persisted remote: cover applied", css.includes("background-size: cover!important"));
  check("persisted remote: referrer meta added", getReferrerMetas(h).length === 1);
}

// ---------- 3. URL 成功流程 ----------
{
  const h = createHarness(undefined);
  h.mod.apply(h.ctx);
  h.sandbox.__imageResult = "success";

  let tree = h.render();
  const input = findTextInput(tree);
  input.props.onChange({ currentTarget: { value: "https://img.example.com/ok.png" } });
  tree = h.render();
  const button = findApplyButton(tree);
  button.props.onClick();
  tree = h.render();

  const saved = h.getSaved();
  check("url success: settings saved", saved && saved.image === "https://img.example.com/ok.png");
  check("url success: style updated", getStyleCss(h).includes('url("https://img.example.com/ok.png")'));
  check("url success: referrer meta added", getReferrerMetas(h).length === 1);
  check("url success: input cleared", findTextInput(tree).props.value === "");
}

// ---------- 4. URL 失败流程 ----------
{
  const h = createHarness(undefined);
  h.mod.apply(h.ctx);
  h.sandbox.__imageResult = "error";

  let tree = h.render();
  const input = findTextInput(tree);
  input.props.onChange({ currentTarget: { value: "https://img.example.com/bad.png" } });
  tree = h.render();
  const button = findApplyButton(tree);
  button.props.onClick();
  tree = h.render();

  const saved = h.getSaved();
  check("url failure: not saved", saved === null);
  check("url failure: shows urlFailed notice", findNotice(tree, "urlFailed") !== null);
  check("url failure: no referrer meta", getReferrerMetas(h).length === 0);
}

// ---------- 5. 无效 URL 流程 ----------
{
  const h = createHarness(undefined);
  h.mod.apply(h.ctx);

  let tree = h.render();
  const input = findTextInput(tree);
  input.props.onChange({ currentTarget: { value: "ftp://example.com/a.png" } });
  tree = h.render();
  const button = findApplyButton(tree);
  button.props.onClick();
  tree = h.render();

  check("invalid url: shows invalidUrl notice", findNotice(tree, "invalidUrl") !== null);
  check("invalid url: not saved", h.getSaved() === null);
}

const failed = checks.filter((c) => !c.ok);
console.log(failed.length === 0 ? "\nALL PASS" : `\nHAS FAILURES: ${failed.length}`);
process.exit(failed.length === 0 ? 0 : 1);
