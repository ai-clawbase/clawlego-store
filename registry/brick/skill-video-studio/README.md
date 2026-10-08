# 视频工作室手艺 · `video-studio` 1.0.3

作品类型「视频工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/video-studio && cd skills/video-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/video-studio/1.0.3/video-studio-1.0.3.tgz'
echo '1d3c2acb74e7dcbbe863635608b96ad058d55ea0676e26a9587a8834760e6fd7  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「视频工作室」（`video_studio`）就会带上这门手艺，不必单独装。
