// dsh-whale-background — browser half (built artifact template).
// 由 build.js 读取 assets/wallpaper.jpg 并内联为 base64 后生成 lib/client.js。
// 格式与内置 tsdown bundle 一致：window.__ModuleLoader__.load({ id, factory })，
// factory 在物化时注入 <style data-plugin>，HMR 驱动按 data-plugin 清理。
window.__ModuleLoader__.load({
	id: "dsh-whale-background",
	factory: (require) => {
		"use strict";
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var WALLPAPER = "data:__WALLPAPER_MIME__;base64,__WALLPAPER_BASE64__";
		var STYLE_TAG_ID = "dsh-whale-background/wallpaper.css";

		// 物化时注入背景样式（与内置 bundle 的 CSS 注入同款，HMR 会按 data-plugin 清理）。
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(STYLE_TAG_ID) + "]") === null) {
			var tag = document.createElement("style");
			tag.dataset.plugin = "dsh-whale-background";
			tag.dataset.pluginCss = STYLE_TAG_ID;
			tag.textContent = [
				// 兜底底色：浅色主题纯白，深色主题深蓝（在下方深色块中覆盖）
				"html,body{background-color:#ffffff!important}",
				// 浅色主题：鲸鱼娘居中完整显示（contain 不裁切），两侧纯白；
				// 应用表面白色半透明（磨砂玻璃），壁纸清晰透出、文字保持可读
				"body{",
				"  --dsw-alias-bg-base: rgba(255,255,255,.6)!important;",
				"  background-image: url(\"" + WALLPAPER + "\")!important;",
				"  background-size: contain!important;",
				"  background-position: center!important;",
				"  background-repeat: no-repeat!important;",
				"  background-attachment: fixed!important;",
				"}",
				// 深色主题：保持右侧壁纸 + 深色渐变方案（浅色文字在白色背景上不可读，
				// 因此深色主题不做白色处理；如需白色两侧请切换浅色主题）
				"body[data-ds-dark-theme]{",
				"  background-color:#0b1020!important;",
				"  --dsw-alias-bg-base: rgba(12,15,23,.52)!important;",
				"  background-image: linear-gradient(90deg, rgba(6,10,20,.94) 0%, rgba(6,10,20,.74) 36%, rgba(6,10,20,.45) 58%, rgba(6,10,20,.2) 78%, rgba(6,10,20,.12) 100%), url(\"" + WALLPAPER + "\")!important;",
				"  background-size: auto 100%, auto 100%!important;",
				"  background-position: left center, right center!important;",
				"}"
			].join("\n");
			document.head.appendChild(tag);
		}

		var inject = [];
		function apply() {
			// 样式注入在物化阶段完成，apply 无需额外行为。
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
