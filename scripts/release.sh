#!/bin/bash
# 一条命令发版：打包 → 校验和 → 读模板正文 → 创建 GitHub Release
# 用法：./scripts/release.sh v0.2.1 docs/releases/v0.2.1.md
set -e
cd "$(dirname "$0")/.."

TAG="${1:?用法: ./scripts/release.sh vX.Y.Z docs/releases/vX.Y.Z.md}"
NOTES="${2:?缺少 notes 文件（可从 docs/RELEASE-TEMPLATE.md 复制）}"
VERSION="${TAG#v}"

[ -f "$NOTES" ] || { echo "找不到 notes 文件：$NOTES"; exit 1; }
if grep -qE '^(curl|tar|npm install|npm ci|./install\.sh)' "$NOTES"; then
  echo "✗ Release 正文里出现了安装命令，请移到 README"; exit 1
fi

echo "==> 打包 v$VERSION"
rm -rf dist && mkdir -p dist
git archive --format=tar.gz --prefix="troll-surveillance-$VERSION/" -o "dist/troll-surveillance-$VERSION.tar.gz" HEAD

echo "==> 计算校验和"
( cd dist && shasum -a 256 "troll-surveillance-$VERSION.tar.gz" > "troll-surveillance-$VERSION.tar.gz.sha256" )

echo "==> 创建 release $TAG"
gh release create "$TAG" \
  "dist/troll-surveillance-$VERSION.tar.gz" \
  "dist/troll-surveillance-$VERSION.tar.gz.sha256" \
  --title "Troll Surveillance $TAG" \
  --notes-file "$NOTES"

echo "==> 完成：$(gh release view "$TAG" --json url -q .url)"
