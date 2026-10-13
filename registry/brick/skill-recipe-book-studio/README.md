# 菜谱书工作室手艺 · `recipe-book-studio` 1.0.0

作品类型「菜谱书工作室」的做法，Agent Skill 格式（`SKILL.md` + 参考文件 + 自带代码）。
成品交付约定见 `SKILL.md` 末尾「Delivery / 交付」：成品与 `delivery.json` 放进产出目录。

## 给云端智能体安装

```sh
mkdir -p skills/recipe-book-studio && cd skills/recipe-book-studio
curl -fsSL -o pack.tgz 'https://download.clawlego.com/skills/recipe-book-studio/1.0.0/recipe-book-studio-1.0.0.tgz'
echo '189baf264167d46f21607451cf272ce604390b2e0acdee8b9a7e67a75c04491e  pack.tgz' > pack.sha256
(sha256sum -c pack.sha256 || shasum -a 256 -c pack.sha256)
tar -xzf pack.tgz && rm -f pack.tgz pack.sha256
```

## 在 ClawLego 里

装作品类型「菜谱书工作室」（`recipe_book_studio`）就会带上这门手艺，不必单独装。
