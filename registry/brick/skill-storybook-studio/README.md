# 绘本工作室手艺 · `storybook-studio` 1.1.3

作品类型「绘本工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/storybook-studio && cd skills/storybook-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/storybook-studio/1.1.3/storybook-studio-1.1.3.tgz'
echo 'c64d6f390b0e34e74215ab29dde27e4547c9363cbbde8690777592a6f5431de9  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「绘本工作室」（`storybook`）就会带上这门手艺，不必单独装。
