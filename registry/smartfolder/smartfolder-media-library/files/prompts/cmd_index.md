# /index — 重建或增量建库

## 工作流

1. 读 `${SPACE_ROOT}/.llm/state/index_cursor.json` 拿水位(视频文件不算 sha——太大,用 path+size+mtime 做指纹)
2. 遍历 `${SPACE_ROOT}`(跳过 `.llm/`),找出新增/变化/删除的视频文件
3. 逐个识别(只看名字和伴随文件,不读视频内容):
   - 从文件名解析:片名、年份、S/E、分辨率(2160p/1080p…)、来源标签(BluRay/WEB-DL)
   - 同目录 .nfo 存在时优先信任 nfo
   - 字幕:同名 .srt/.ass 及内嵌标记(文件名带 chs/cht/中字)
   - 多版本同片:归并到同一个 title,files 数组挂多条
4. 写 `${SPACE_ROOT}/.llm/index/titles.jsonl`(字段约定见 persona);把握不大的标 `confidence:"low"`
5. 剧集统计缺集:对每季按已有集号算 missing
6. 更新水位;简报:新增 N 部、识别失败 K 个(列出原始文件名)、发现缺集的剧集清单

## 不做的事

- 不读视频二进制;不调用外部刮削 API(纯本地推断,拿不准就标 low)
- 不动任何原始文件
