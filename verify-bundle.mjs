// verify-bundle.mjs — 模拟浏览器执行 lib/client.js，校验插件形状与注入的 CSS。
import { readFileSync } from "node:fs";
import vm from "node:vm";

const src = readFileSync("E:/dsh_workspace/dsh-client-ui-whale-background/lib/client.js", "utf8");
let loaded = null;
const tags = [];
const sandbox = {
  window: { __ModuleLoader__: { load: (p) => { loaded = p; } } },
  document: {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: "" }),
    head: { appendChild: (t) => tags.push(t) },
  },
};
vm.createContext(sandbox);
vm.runInContext(src, sandbox, { filename: "client.js" });

const checks = {
  "load called with id": loaded?.id === "dsh-client-ui-whale-background",
  "factory is function": typeof loaded?.factory === "function",
};
const exports = loaded.factory(() => { throw new Error("unexpected require"); });
checks["exports apply/inject"] = typeof exports.apply === "function" && Array.isArray(exports.inject);
const css = tags[0]?.textContent ?? "";
checks["style injected once"] = tags.length === 1;
checks["wallpaper data uri"] = css.includes('data:image/jpeg;base64,');
checks["light: centered contain"] = css.includes("background-size: contain!important") && css.includes("background-position: center!important");
checks["light: white sides"] = css.includes("background-color:#ffffff!important");
checks["light: frosted surface .6"] = css.includes("rgba(255,255,255,.6)");
checks["dark: right poster kept"] = css.includes("right center") && css.includes("rgba(12,15,23,.52)");
checks["dark: own bg color"] = css.includes("background-color:#0b1020!important");

let ok = true;
for (const [k, v] of Object.entries(checks)) { console.log(`${v ? "PASS" : "FAIL"}  ${k}`); if (!v) ok = false; }
console.log(ok ? "\nALL PASS" : "\nHAS FAILURES");
process.exit(ok ? 0 : 1);
