#!/bin/bash
# 生成下一版 Release 正文骨架：./scripts/new-release.sh 0.2.2
set -e
V="${1:-0.2.2}"
OUT="docs/releases/v$V.md"
[ -f "$OUT" ] && { echo "$OUT 已存在，不覆盖"; exit 1; }

cat > "$OUT" <<'TPL'
## ✨ New

1. **Feature name** — what it does and why it matters (`/path` or `?param=1`).
2. **Feature name** — one line.

## 🐛 Fixes

- **Symptom** — cause, now fixed.
- **Symptom** — one line.

## 🚀 Features

- **Capability** — scope and boundaries.
- **Capability** — one line.

<details>
<summary>中文说明</summary>

### ✨ 新增
1. **功能名**：一句说明（带路径/参数）。
### 🐛 修复
- **现象**：原因 → 现在。
### 🚀 功能
- **能力**：范围与边界。

</details>

> Installation and usage: see the [README](https://github.com/IceCokei/troll-surveillance#quick-start).
TPL

echo "已生成 $OUT"
echo "填完后： ./scripts/check-release-notes.sh $OUT"
echo "打 tag： git tag -a v$V -m \"Troll Surveillance v$V\" && git push origin v$V"
