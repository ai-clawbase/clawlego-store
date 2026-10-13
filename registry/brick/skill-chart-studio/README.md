# 图表工作室手艺 · `chart-studio` 1.0.0

作品类型「图表工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/chart-studio && cd skills/chart-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/chart-studio/1.0.0/chart-studio-1.0.0.tgz'
echo '6341a51c9f568541d6b34c9215c6288589792abb5cc8812125f3c86bbe6622ff  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「图表工作室」（`chart_studio`）就会带上这门手艺，不必单独装。
