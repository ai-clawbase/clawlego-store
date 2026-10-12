# 绘本工作室手艺 · `storybook-studio` 1.1.4

作品类型「绘本工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/storybook-studio && cd skills/storybook-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/storybook-studio/1.1.4/storybook-studio-1.1.4.tgz'
echo '26bffb0a168b6d14c797943d4d4061d6afbb9ab7696886c055a15279b4f113bc  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「绘本工作室」（`storybook`）就会带上这门手艺，不必单独装。
