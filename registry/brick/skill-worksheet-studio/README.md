# 练习卷工作室手艺 · `worksheet-studio` 1.0.0

作品类型「练习卷工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/worksheet-studio && cd skills/worksheet-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/worksheet-studio/1.0.0/worksheet-studio-1.0.0.tgz'
echo '63343c1a5e23e35f3074ba145ac09d7b9ae17647b8018981f7c6ff4fc2ba8726  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「练习卷工作室」（`worksheet_studio`）就会带上这门手艺，不必单独装。
