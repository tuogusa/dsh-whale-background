# dsh-whale-background

DeepSeek Harness Web 背景插件（client-only）：深海鲸鱼娘壁纸 + 半透明磨砂应用表面。

## 效果

- **浅色主题**：壁纸居中完整显示（contain 不裁切），两侧纯白，应用表面白色半透明（`rgba(255,255,255,.6)` 磨砂），壁纸清晰透出、文字保持可读
- **深色主题**：右侧保留壁纸 + 深色渐变遮罩（`rgba(12,15,23,.52)` 表面），文字保持可读

## 安装

```bash
dsh plugin --profile web add github:<your-name>/dsh-whale-background
```

然后按 `dsh` 引导添加 `pnpm-workspace.yaml` 的 allowBuilds 条目（git 依赖的 prepare 脚本需要放行），重启 DSH 并 `Ctrl+Shift+R` 刷新浏览器。

## 换壁纸

把任意图片（JPG/PNG/WebP/GIF，`build.js` 自动识别格式）覆盖到 `assets/wallpaper.jpg`，然后：

```bash
node build.js
```

重新生成 `lib/client.js`（base64 内联）。profile 里是符号链接，重建后 HMR 自动热重载；未连接 HMR 则 `Ctrl+Shift+R` 强刷。

## 结构

```
assets/wallpaper.jpg    壁纸原图（当前为 1080x1440 JPEG）
src/client.template.js  浏览器侧模板（含 __WALLPAPER_MIME__/__WALLPAPER_BASE64__ 占位符）
build.js                构建脚本：壁纸 → base64 内联 → 生成 lib/client.js
lib/client.js           构建产物（被 exports["./client"] 引用）
lib/index.js            host half（空插件，仅让 loader 行保持 enabled 以便 client-modules 收录）
```

## License

MIT
