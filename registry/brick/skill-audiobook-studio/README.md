# 有声书工作室手艺 · `audiobook-studio` 1.0.0

作品类型「有声书工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/audiobook-studio && cd skills/audiobook-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/audiobook-studio/1.0.0/audiobook-studio-1.0.0.tgz'
echo 'df8ab5ca751cc57c129af4015b22d94b163746df3be7230f83bae1f8d30e6b86  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「有声书工作室」（`audiobook_studio`）就会带上这门手艺，不必单独装。
