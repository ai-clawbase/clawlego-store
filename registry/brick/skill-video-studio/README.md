# 视频工作室手艺 · `video-studio` 1.1.0

作品类型「视频工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/video-studio && cd skills/video-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/video-studio/1.1.0/video-studio-1.1.0.tgz'
echo 'cfaf60feec489f76196cdeeac90d65598bcc1fea75203667d25c07e90089ad8e  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「视频工作室」（`video_studio`）就会带上这门手艺，不必单独装。
