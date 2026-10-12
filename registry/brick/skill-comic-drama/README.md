# AI 漫剧工作室手艺 · `comic-drama` 1.1.0

作品类型「AI 漫剧工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/comic-drama && cd skills/comic-drama
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/comic-drama/1.1.0/comic-drama-1.1.0.tgz'
echo 'e54acb07d380b502748a689faef3ab952a62884ef0df2313aa110b8cf4d7d428  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「AI 漫剧工作室」（`comic_drama`）就会带上这门手艺，不必单独装。
