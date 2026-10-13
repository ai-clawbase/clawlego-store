# 闪卡工作室手艺 · `flashcard-studio` 1.0.0

作品类型「闪卡工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/flashcard-studio && cd skills/flashcard-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/flashcard-studio/1.0.0/flashcard-studio-1.0.0.tgz'
echo '2fc82308aae9a9edea5da905566683b75deb02960ecdb8ca26a4a472f627ec5a  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「闪卡工作室」（`flashcard_studio`）就会带上这门手艺，不必单独装。
