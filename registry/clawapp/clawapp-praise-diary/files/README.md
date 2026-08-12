# 夸夸日记 · 夸夸星球

一个默认私有、同时适配 Mobile 与 Web 的亲子日记 ClawApp。家长和孩子可以用文字、录音、图片和短视频，把值得被看见的努力收进“星星罐”。

## 数据与隐私

- 日记记录落在应用自己的 `data/praise_entry/`。
- 媒体落在应用自己的 `files/media/`，实体里只保存 opaque media id。
- `public.enabled: false`；应用没有对外 action，家庭内容不会进入公开页。
- 升级保留 `data/` 与 `files/`；`.clawapp` 分发包只包含代码、schema 和静态资源。

## 主要交互

- “星光”：浏览近期夸夸，创建文字、语音、图片或视频日记。
- “时光”：月历、图库和关键词搜索。
- “家人”：查看参与记录的家庭成员和星光统计。

单个媒体上限 32 MiB。录音由 `clawapp.media.recorder` 在可信宿主完成，应用 iframe 保持 opaque-origin 沙箱。

## 第三方资源

`web/icons.js` 的图标数据来自 Carbon Design System Icons，采用 Apache-2.0 许可证；详见 `web/THIRD_PARTY_NOTICES.txt`。
