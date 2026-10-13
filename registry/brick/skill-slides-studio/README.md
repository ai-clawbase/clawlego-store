# 演示文稿工作室手艺 · `slides-studio` 1.0.0

作品类型「演示文稿工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/slides-studio && cd skills/slides-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/slides-studio/1.0.0/slides-studio-1.0.0.tgz'
echo '99896866d33a554d28bbce636c1c40dc9d2a6db6f24b0a34db1c04b86ed20481  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「演示文稿工作室」（`slides_studio`）就会带上这门手艺，不必单独装。
