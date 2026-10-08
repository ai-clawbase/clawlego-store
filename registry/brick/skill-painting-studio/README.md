# 画作工作室手艺 · `painting-studio` 1.0.2

作品类型「画作工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/painting-studio && cd skills/painting-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/painting-studio/1.0.2/painting-studio-1.0.2.tgz'
echo '25b33ef717a0c505fd23759cf45965f20e15f8635a84ecdad78b599ee8623559  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「画作工作室」（`painting_studio`）就会带上这门手艺，不必单独装。
