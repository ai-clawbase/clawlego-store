# 表情包工作室手艺 · `sticker-studio` 1.0.0

作品类型「表情包工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/sticker-studio && cd skills/sticker-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/sticker-studio/1.0.0/sticker-studio-1.0.0.tgz'
echo '1995cd0604bf78d7081f653173e05abcff1aa95b589a53a4f38b853d7e86e277  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「表情包工作室」（`sticker_studio`）就会带上这门手艺，不必单独装。
