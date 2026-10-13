# 简历工作室手艺 · `resume-studio` 1.0.0

作品类型「简历工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/resume-studio && cd skills/resume-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/resume-studio/1.0.0/resume-studio-1.0.0.tgz'
echo '21123af5011927c71b7997c4a90606d7fc1838ab9b119c10a5c630b4439b711e  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「简历工作室」（`resume_studio`）就会带上这门手艺，不必单独装。
