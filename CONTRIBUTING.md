# Contributing

欢迎 PR。这个项目只做**情报聚合与判定**，不接收漏洞利用代码、修改版固件或越狱工具本体。

## 提交规范

```
<type>(<scope>): <简述>

type: feat | fix | docs | style | refactor | chore | perf | test
scope: collect | analyze | devices | digest | ui | i18n | theme | release | docs
```

示例：

- `feat(collect): add Relaxin SPA bundle parser`
- `fix(digest): dedupe tool versions, keep newest`
- `docs(readme): template section for exploit tracking`

## PR 检查清单

- [ ] `npm run build` 通过（CI 也会跑）
- [ ] 新增文案同时补 `lib/i18n.ts` 的中英两份
- [ ] 新增页面在导航里有入口，并支持 `?lang=` / `?theme=`
- [ ] 没有把 `data/*.json`、日志、设备标识提交上来
- [ ] 截图用 `?redact=1` 生成（隐藏 UDID / 型号 / 区域）
- [ ] README 里是真正的换行，不是字面 `\n`（CI 会拦）

## 新增一个数据源

1. 在 `lib/collect/` 加适配器，返回 `RawItem[]`
2. 在 `lib/sync.ts` 里注册，并 `mark()` 记录健康度
3. 需要限流就在 `meta` 里加冷却字段（参考 `ghCooldown` / `feedCooldown`）
4. 在 README 的 Data sources 表补一行

## 新增一个工具 / 利用代码条目

| 类型 | 改哪里 |
| --- | --- |
| 可下载的越狱 / 侧载工具 | `lib/knowledge.ts` 的 `TOOLS`（支持 `maxVersionBySoc` 与 `ranges` 非连续区间） |
| TrollStore 生态工具 | `lib/trollstore.ts` 的 `TS_TOOLS` |
| 公开利用代码仓库 | `lib/exploits.ts` 的 `EXPLOITS`，然后跑 `npx tsx scripts/exploit-probe.ts` |

## 发版流程

```bash
# 1) 升版本号
npm version patch --no-git-tag-version   # 或手动改 package.json

# 2) 从模板写正文
cp docs/RELEASE-TEMPLATE.md docs/releases/v0.2.1.md
$EDITOR docs/releases/v0.2.1.md          # 只写 新增 / 修复 / 功能，不写安装命令

# 3) 一条命令发版（打包 + sha256 + 创建 release）
./scripts/release.sh v0.2.1 docs/releases/v0.2.1.md
```

发版正文规范见 [docs/RELEASE-TEMPLATE.md](docs/RELEASE-TEMPLATE.md)：分节固定、每条一句、emoji 只用两层、安装步骤只在 README。

## 隐私

- 本仓库不提交 `data/*.json`（含 UDID 尾号、型号、抓取缓存）
- 提交截图前必须访问 `/?redact=1` 或 `/devices?redact=1`
- 发现历史里误入敏感内容，直接开 issue，不要公开贴出内容
