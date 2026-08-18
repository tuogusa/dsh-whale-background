// dsh-whale-background — browser half (built artifact template).
// 由 build.js 读取 assets/wallpaper.jpg 并内联为 base64 后生成 lib/client.js。
//
// 功能：
//   - 默认内置鲸鱼壁纸（assets/wallpaper.jpg 构建期内联）；
//   - 设置页「背景」分区：更换背景图片（本地文件或 URL）、调整表面透明度、
//     contain/cover 铺放方式、恢复默认；
//   - 设置保存在 localStorage（key: dsh-whale-background），刷新后保留。
window.__ModuleLoader__.load({
	id: "dsh-whale-background",
	factory: (require) => {
		"use strict";
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var react = require("react");
		var h = react.createElement;

		var WALLPAPER = "data:__WALLPAPER_MIME__;base64,__WALLPAPER_BASE64__";
		var STYLE_TAG_ID = "dsh-whale-background/wallpaper.css";
		var STORAGE_KEY = "dsh-whale-background";
		var NS = "settings.whaleBackground";
		var DEFAULTS = { image: "", surfaceOpacity: 0.6, mode: "contain" };

		// ---------- 多语言 ----------
		var zh = {
			nav: "背景",
			intro: "更换 DSH Web 背景图片，并调整应用表面透明度。设置保存在本地浏览器，刷新后仍然保留。",
			chooseFile: "选择本地图片",
			urlPlaceholder: "粘贴图片 URL，回车应用",
			applyUrl: "应用 URL",
			clearImage: "清除自定义图片",
			opacity: "表面透明度",
			opacityHint: "数值越低，应用表面越透明、壁纸越清晰。",
			mode: "铺放方式",
			modeContain: "完整显示（contain）",
			modeCover: "铺满全屏（cover）",
			reset: "恢复默认",
			resetDone: "已恢复默认",
			saved: "已应用",
			imageTooLarge: "图片过大，无法保存到本地（浏览器限制约 5MB）。请换一张较小的图片或改用 URL。",
			invalidUrl: "URL 无效，请检查后重试。"
		};
		var en = {
			nav: "Background",
			intro: "Change the DSH Web background image and adjust the app surface transparency. Settings are stored in this browser and persist across reloads.",
			chooseFile: "Choose local image",
			urlPlaceholder: "Paste image URL and press Enter",
			applyUrl: "Apply URL",
			clearImage: "Clear custom image",
			opacity: "Surface opacity",
			opacityHint: "Lower values make the app surface more transparent and the wallpaper more visible.",
			mode: "Fit mode",
			modeContain: "Contain",
			modeCover: "Cover",
			reset: "Reset to default",
			resetDone: "Reset to default",
			saved: "Applied",
			imageTooLarge: "Image is too large to store locally (browser limit is about 5MB). Use a smaller image or a URL instead.",
			invalidUrl: "Invalid URL. Please check and try again."
		};

		// ---------- 工具 ----------
		function clamp(value, min, max) {
			return Math.min(max, Math.max(min, value));
		}

		function cssUrl(value) {
			return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
		}

		// ---------- 设置读写 ----------
		function readSettings() {
			var out = { image: DEFAULTS.image, surfaceOpacity: DEFAULTS.surfaceOpacity, mode: DEFAULTS.mode };
			try {
				var raw = localStorage.getItem(STORAGE_KEY);
				if (raw) {
					var data = JSON.parse(raw);
					if (typeof data.image === "string") out.image = data.image;
					if (typeof data.surfaceOpacity === "number") out.surfaceOpacity = clamp(data.surfaceOpacity, 0, 1);
					if (data.mode === "cover" || data.mode === "contain") out.mode = data.mode;
				}
			} catch (e) {
				// 本地数据损坏时使用默认值
			}
			return out;
		}

		function saveSettings(settings) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		}

		// ---------- 样式应用 ----------
		function ensureStyleTag() {
			var tag = document.querySelector("style[data-plugin-css=" + JSON.stringify(STYLE_TAG_ID) + "]");
			if (tag === null) {
				tag = document.createElement("style");
				tag.dataset.plugin = "dsh-whale-background";
				tag.dataset.pluginCss = STYLE_TAG_ID;
				document.head.appendChild(tag);
			}
			return tag;
		}

		function applySettings(settings) {
			if (typeof document === "undefined") return;
			var image = settings.image && settings.image !== "" ? settings.image : WALLPAPER;
			var opacity = settings.surfaceOpacity;
			var mode = settings.mode;
			var lightBg = "rgba(255,255,255," + opacity + ")";
			var darkBg = "rgba(12,15,23," + opacity + ")";
			var imageSize = mode === "cover" ? "cover" : "contain";
			var darkImageSize = mode === "cover" ? "cover" : "auto 100%";
			var css = [
				// 兜底底色：浅色主题纯白，深色主题深蓝（在下方深色块中覆盖）
				"html,body{background-color:#ffffff!important}",
				// 浅色主题：壁纸按所选方式居中显示，应用表面半透明磨砂
				"body{",
				"  --dsw-alias-bg-base: " + lightBg + "!important;",
				"  background-image: url(\"" + cssUrl(image) + "\")!important;",
				"  background-size: " + imageSize + "!important;",
				"  background-position: center!important;",
				"  background-repeat: no-repeat!important;",
				"  background-attachment: fixed!important;",
				"}",
				// 深色主题：保留右侧壁纸 + 深色渐变方案
				"body[data-ds-dark-theme]{",
				"  background-color:#0b1020!important;",
				"  --dsw-alias-bg-base: " + darkBg + "!important;",
				"  background-image: linear-gradient(90deg, rgba(6,10,20,.94) 0%, rgba(6,10,20,.74) 36%, rgba(6,10,20,.45) 58%, rgba(6,10,20,.2) 78%, rgba(6,10,20,.12) 100%), url(\"" + cssUrl(image) + "\")!important;",
				"  background-size: auto 100%, " + darkImageSize + "!important;",
				"  background-position: left center, right center!important;",
				"}"
			].join("\n");
			var tag = ensureStyleTag();
			tag.textContent = css;
		}

		function resetSettings() {
			var next = { image: DEFAULTS.image, surfaceOpacity: DEFAULTS.surfaceOpacity, mode: DEFAULTS.mode };
			try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* 忽略 */ }
			applySettings(next);
			return next;
		}

		// 模块物化时立即应用已保存的设置（HMR 按 data-plugin 清理并重新物化）
		if (typeof document !== "undefined") applySettings(readSettings());

		// ---------- 设置页组件 ----------
		function WhaleBackgroundSection(props) {
			var t = props.t;
			var settingsState = react.useState(function () { return readSettings(); });
			var settings = settingsState[0];
			var setSettings = settingsState[1];
			var noticeState = react.useState("");
			var notice = noticeState[0];
			var setNotice = noticeState[1];
			var urlState = react.useState("");
			var url = urlState[0];
			var setUrl = urlState[1];

			function commit(next) {
				try {
					saveSettings(next);
					applySettings(next);
					setSettings(next);
					setNotice(t("saved"));
				} catch (e) {
					setNotice(t("imageTooLarge"));
				}
			}

			function onFile(event) {
				var file = event.currentTarget.files && event.currentTarget.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () {
					commit(Object.assign({}, settings, { image: String(reader.result) }));
				};
				reader.onerror = function () {
					setNotice(t("invalidUrl"));
				};
				reader.readAsDataURL(file);
			}

			function onUrlApply() {
				var value = url.trim();
				if (!/^https?:\/\/.+/.test(value)) {
					setNotice(t("invalidUrl"));
					return;
				}
				commit(Object.assign({}, settings, { image: value }));
				setUrl("");
			}

			function onClear() {
				commit(Object.assign({}, settings, { image: "" }));
			}

			function onOpacity(event) {
				commit(Object.assign({}, settings, { surfaceOpacity: Number(event.currentTarget.value) }));
			}

			function onMode(event) {
				commit(Object.assign({}, settings, { mode: event.currentTarget.value }));
			}

			function onReset() {
				var next = resetSettings();
				setSettings(next);
				setUrl("");
				setNotice(t("resetDone"));
			}

			var inputStyle = {
				font: "inherit",
				boxSizing: "border-box",
				background: "var(--dsw-alias-interactive-bg-hover)",
				color: "var(--dsw-alias-label-primary)",
				border: "1px solid var(--dsw-alias-border-l1)",
				borderRadius: "10px",
				padding: "4px 10px",
				fontSize: "13px",
				outline: "none"
			};
			var buttonStyle = {
				font: "inherit",
				cursor: "pointer",
				background: "var(--dsw-alias-interactive-bg-hover)",
				color: "var(--dsw-alias-label-secondary)",
				border: "1px solid var(--dsw-alias-border-l2)",
				borderRadius: "12px",
				padding: "4px 12px",
				fontSize: "12px",
				lineHeight: "20px",
				flex: "none"
			};

			return h("div", { style: { display: "flex", flexDirection: "column", gap: "14px", maxWidth: "560px" } },
				h("p", { style: { margin: 0, fontSize: "13px", lineHeight: "20px", color: "var(--dsw-alias-label-tertiary)" } }, t("intro")),
				notice !== "" ? h("p", { style: { margin: 0, fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, notice) : null,
				h("div", { style: { display: "flex", flexDirection: "column", gap: "6px" } },
					h("label", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, t("chooseFile")),
					h("input", { type: "file", accept: "image/*", onChange: onFile })
				),
				h("div", { style: { display: "flex", gap: "6px", alignItems: "center" } },
					h("input", {
						type: "text",
						value: url,
						placeholder: t("urlPlaceholder"),
						onChange: function (e) { setUrl(e.currentTarget.value); },
						onKeyDown: function (e) { if (e.key === "Enter") onUrlApply(); },
						style: Object.assign({}, inputStyle, { flex: "auto" })
					}),
					h("button", { type: "button", onClick: onUrlApply, style: buttonStyle }, t("applyUrl"))
				),
				h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
					h("span", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)", flex: "none" } }, t("opacity") + " " + Math.round(settings.surfaceOpacity * 100) + "%"),
					h("input", {
						type: "range",
						min: "0",
						max: "1",
						step: "0.05",
						value: settings.surfaceOpacity,
						onChange: onOpacity,
						style: { flex: "auto" }
					})
				),
				h("div", { style: { display: "flex", alignItems: "center", gap: "10px" } },
					h("label", { style: { fontSize: "13px", color: "var(--dsw-alias-label-secondary)" } }, t("mode")),
					h("select", { value: settings.mode, onChange: onMode, style: Object.assign({}, inputStyle, { flex: "auto" }) },
						h("option", { value: "contain" }, t("modeContain")),
						h("option", { value: "cover" }, t("modeCover"))
					)
				),
				h("div", { style: { display: "flex", gap: "8px" } },
					h("button", { type: "button", onClick: onClear, style: buttonStyle }, t("clearImage")),
					h("button", { type: "button", onClick: onReset, style: buttonStyle }, t("reset"))
				)
			);
		}

		// ---------- 插件接入 ----------
		var inject = ["slots", "locale"];

		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, { zh, en }), "ui-whale-background: dictionaries");
			var t = ctx.locale.bind(NS);
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "whale-background",
				order: 15,
				label: () => t("nav"),
				locale: NS,
				inject: () => ({})
			}, WhaleBackgroundSection));
		}

		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
