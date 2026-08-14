# 夸夸日记 · 夸夸星球

一个手机版亲子日记 ClawApp。家长和孩子可以用文字、录音、图片和短视频，把值得被看见的努力收进“星星罐”。

## 数据与隐私

- 日记记录落在应用自己的 `data/praise_entry/`。
- 家庭与成员分别落在 `data/praise_family/` 和 `data/family_member/`，创建、切换、口令与成员管理均由应用 JavaScript 完成。
- 媒体落在应用自己的 `files/media/`，实体里只保存 opaque media id。
- 对外只开放 `receive`：亲友能送来一颗夸夸星，但无法读取家庭内容、历史或媒体。
- 升级保留 `data/` 与 `files/`；`.clawapp` 分发包只包含代码、schema 和静态资源。

## 主要交互

- “星光”：浏览近期夸夸，创建文字、语音、图片或视频日记。
- “时光”：月历、分类筛选和关键词搜索；日记可查看、编辑、分享和软删除。
- “家人”：创建/切换家庭、输入或生成家庭口令、添加/编辑/移除成员和查看星光统计。

单个媒体上限 32 MiB。录音优先由 `clawapp.media.recorder` 在可信宿主完成；宿主录音桥不可用时，应用会在浏览器中用 `MediaRecorder` 回退并仍通过应用私有媒体接口保存。应用 iframe 保持 opaque-origin 沙箱。

## 第三方资源

`web/icons.js` 的图标数据来自 Carbon Design System Icons，采用 Apache-2.0 许可证；详见 `web/THIRD_PARTY_NOTICES.txt`。
