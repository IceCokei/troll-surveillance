#!/bin/bash
# 校验 Release 正文是否符合项目格式（release workflow 与本地共用）
# 用法：./scripts/check-release-notes.sh docs/releases/v0.2.1.md
set -e
FILE="${1:-docs/releases/v0.2.1.md}"
fail=0

err() { echo "::error file=$FILE::$1"; fail=1; }

[ -f "$FILE" ] || { echo "找不到 $FILE"; exit 1; }

grep -qE '^## (✨ New|🌱 First release)' "$FILE" || err "缺少 '## ✨ New' 或 '## 🌱 First release' 分节"
grep -q '^## 🐛 Fixes' "$FILE" || err "缺少 '## 🐛 Fixes' 分节"
grep -q '^## 🚀 Features' "$FILE" || err "缺少 '## 🚀 Features' 分节"

awk '/^## (✨ New|🌱 First release)/{f=1;next}/^## /{f=0}f&&/^[0-9]+\. /{c++}END{exit c>0?0:1}' "$FILE" \
  || err "New 分节请使用有序列表（1. 2. 3.）"

if grep -nE '^[-*] [✨🐛🚀⚠️🌱📝🧰🧭🌍🌗🕶️📡🧵]' "$FILE" >/dev/null; then
  err "条目不要带 emoji，emoji 只放在分节标题"
fi

if grep -qE '^(curl|tar|npm install|npm ci|\./install\.sh)' "$FILE"; then
  err "正文不要写安装命令，统一放在 README"
fi

grep -q '<details>' "$FILE" || err "缺少 <details> 中文折叠块"
grep -q '</details>' "$FILE" || err "缺少 </details>"
grep -q 'README' "$FILE" || err "结尾请留一句指向 README 的链接"

if [ "$fail" -ne 0 ]; then
  echo "✗ Release 正文格式不符合规范，见 docs/RELEASE-TEMPLATE.md"
  exit 1
fi
echo "✓ Release 正文格式 OK"
