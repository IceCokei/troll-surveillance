# Release notes template

> Copy to `docs/releases/vX.Y.Z.md`, fill in, then
> `./scripts/release.sh vX.Y.Z docs/releases/vX.Y.Z.md`
>
> **Never put install commands in the release body** — they live in the README Quick start. End with a single link.

---

## Style rules

| Rule | Detail |
| --- | --- |
| Emoji | **Section headings only** (✨ / 🐛 / 🚀 / ⚠️ / 🌱). No emoji on individual bullets. |
| Lists | Numbered list for `New` (1, 2, 3…), bullets for `Fixes` and `Features`. |
| One line each | `**Thing** — what it does / what it fixes.` No second paragraph. |
| No duplicates | If it appears in `New`, do not repeat it in `Features`. |
| Length | 5–8 items per section. More than that means split the release. |
| Verify | Include paths, API routes or query params (`/devices`, `?lang=en`, `/api/watch`). |
| Language | English first (default on GitHub), Chinese inside a `<details>` block. |

## Skeleton

```markdown
## ✨ New

1. **Feature name** — what it does, why it matters (`/path` or `?param=1`).
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
```

## Emoji map (keep stable)

| Section | Icon |
| --- | --- |
| New | ✨ |
| Fixes | 🐛 |
| Features | 🚀 |
| Breaking | ⚠️ |
| First release | 🌱 |
