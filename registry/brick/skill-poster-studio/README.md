# 海报工作室手艺 · `poster-studio` 1.0.3

作品类型「海报工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/poster-studio && cd skills/poster-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/poster-studio/1.0.3/poster-studio-1.0.3.tgz'
echo '9ee27543cabb8156865e36b7bdc0914ba14ce15629bcb2a436730d3fd7008ddd  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「海报工作室」（`poster_studio`）就会带上这门手艺，不必单独装。
