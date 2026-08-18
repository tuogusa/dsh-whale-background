# dsh-whale-background 设置功能设计

日期：2026-08-18
状态：已实现

## 目标

为 `dsh-whale-background` 插件增加两项核心能力：

1. 更换背景图片
2. 修改背景透明度

同时按用户确认的范围加入：

- 铺放方式：`contain` / `cover`
- 设置持久化（localStorage）与恢复默认

## 方案

采用现有「host + client 一体包」结构，不新建独立 client-ui 包。

- 背景效果仍由 `src/client.template.js` → `lib/client.js` 负责；
- 设置页接入 DSH 自带设置页的 `settings.section` 插槽；
- 默认鲸鱼壁纸仍由 `build.js` 构建期内联为 base64，作为兜底。

## 数据存储

- key：`dsh-whale-background`
- 结构：

```json
{
  "image": "",
  "surfaceOpacity": 0.6,
  "mode": "contain"
}
```

- `image` 为空时使用内置壁纸；否则为 data URL 或 http(s) URL。
- `surfaceOpacity` 范围 0–1，默认 0.6。
- `mode` 取值 `contain` / `cover`。

## 设置页

- 分区 id：`whale-background`
- 控件：
  - 本地图片选择（FileReader 转 data URL）
  - 图片 URL 输入 + 应用
  - 清除自定义图片
  - 透明度滑块（0–100%）
  - 铺放方式选择（contain / cover）
  - 恢复默认

## 样式行为

- 浅色主题：`background-size` 按 `mode` 取值，`--dsw-alias-bg-base` 使用 `rgba(255,255,255,opacity)`。
- 深色主题：保留右侧壁纸 + 深色渐变，`--dsw-alias-bg-base` 使用 `rgba(12,15,23,opacity)`。
- 所有改动即时生效并写入 localStorage。

## 验证

- `node build.js` 成功重新生成 `lib/client.js`。
- `node --check lib/client.js` 语法通过。
- 运行期验证：重启 DSH Web 后进入 设置 → 背景，测试换图、透明度、contain/cover、刷新持久化、恢复默认。
