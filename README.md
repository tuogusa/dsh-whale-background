# dsh-whale-background

DeepSeek Harness Web 背景插件（client-only）：深海鲸鱼娘壁纸 + 半透明磨砂应用表面，并支持在 DSH 设置页自定义背景。

## 功能

- **默认鲸鱼壁纸**：内置 `assets/wallpaper.jpg`，构建时内联为 base64，开箱即用
- **设置页自定义背景**：进入 **DSH Web → 设置 → 背景**
  - 更换背景图片：选择本地图片（自动转 data URL），或粘贴图片 URL
  - 清除自定义图片：回到内置鲸鱼壁纸
  - 表面透明度：0–100% 滑块，实时生效
  - 铺放方式：`contain`（完整显示）/ `cover`（铺满全屏）
  - 恢复默认：一键清除自定义设置
- **持久化**：设置保存在浏览器 `localStorage`（key `dsh-whale-background`），刷新/重启后保留

## 效果

- **浅色主题**：壁纸居中完整显示（contain 不裁切）或铺满全屏，两侧纯白，应用表面白色半透明（磨砂），文字保持可读
- **深色主题**：右侧保留壁纸 + 深色渐变遮罩，应用表面深色半透明，文字保持可读

## 安装

```bash
dsh plugin --profile web add github:tuogusa/dsh-whale-background
```

或从本地工作区安装：

```bash
dsh plugin --profile web add link:E:/dsh_workspace/dsh-whale-background
```

**兼容 Profile**：`web`（DSH Web GUI）。

安装后重启 DSH 并 `Ctrl+Shift+R` 刷新浏览器。

## 换内置壁纸（默认图）

把任意图片（JPG/PNG/WebP/GIF，`build.js` 自动识别格式）覆盖到 `assets/wallpaper.jpg`，然后：

```bash
node build.js
```

重新生成 `lib/client.js`（base64 内联）。profile 里是符号链接，重建后 HMR 自动热重载；未连接 HMR 则 `Ctrl+Shift+R` 强刷。

## 结构

```
assets/wallpaper.jpg    壁纸原图（当前为 1080x1440 JPEG）
src/client.template.js  浏览器侧模板（含 __WALLPAPER_MIME__/__WALLPAPER_BASE64__ 占位符，及设置页实现）
build.js                构建脚本：壁纸 → base64 内联 → 生成 lib/client.js
lib/client.js           构建产物（被 exports["./client"] 引用）
lib/index.js            host half（空插件，仅让 loader 行保持 enabled 以便 client-modules 收录）
```

## License

MIT
