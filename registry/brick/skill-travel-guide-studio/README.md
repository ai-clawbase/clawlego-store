# 旅行手册工作室手艺 · `travel-guide-studio` 1.0.0

作品类型「旅行手册工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/travel-guide-studio && cd skills/travel-guide-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/travel-guide-studio/1.0.0/travel-guide-studio-1.0.0.tgz'
echo 'e40234514c5f02dac5c3b350697a693a0435983c6918071ecdec66fe207973ba  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「旅行手册工作室」（`travel_guide_studio`）就会带上这门手艺，不必单独装。
