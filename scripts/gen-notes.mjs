#!/usr/bin/env node
/**
 * 从 git 提交自动生成 docs/releases/vX.Y.Z.md（项目模板格式）。
 * 用法：node scripts/gen-notes.mjs 0.2.6
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2];
if (!version) {
  console.error('usage: node scripts/gen-notes.mjs <version>');
  process.exit(1);
}

const sh = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

function lastTag() {
  try {
    return sh('git describe --tags --abbrev=0 2>/dev/null');
  } catch {
    return '';
  }
}

const from = lastTag();
const range = from ? `${from}..HEAD` : 'HEAD';
const raw = sh(`git log ${range} --no-merges --pretty=format:%s`);

const TYPE = {
  feat: 'new',
  fix: 'fix',
  perf: 'feat',
  refactor: 'feat',
  revert: 'fix',
  docs: 'skip',
  chore: 'skip',
  ci: 'skip',
  style: 'skip',
  test: 'skip',
};

const buckets = { new: [], fix: [], feat: [] };

for (const subject of raw.split('\n').filter(Boolean)) {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  if (!m) continue;
  const [, type, scope, text] = m;
  if (subject.startsWith('chore(release)')) continue;
  const bucket = TYPE[type];
  if (!bucket || bucket === 'skip') continue;
  const label = scope ? `**${scope}** — ${text}` : `**${text}**`;
  buckets[bucket].push(label.replace(/\.$/, ''));
}

// 兜底：如果全是 chore/ci/docs，就把原始提交标题列进 New，避免正文空掉
let rawSubjects = raw.split(String.fromCharCode(10)).filter((x) => x && !x.startsWith('chore(release)'));
if (!buckets.new.length && !buckets.fix.length && !buckets.feat.length) {
  buckets.new = rawSubjects.slice(0, 8).map((x) => '**' + x + '**');
}

const pick = (arr) => (arr.length ? arr : ['—']);

const newItems = pick(buckets.new);
const fixItems = pick(buckets.fix);
const featItems = pick(buckets.feat);

const numbered = (arr) => (arr.length === 1 && arr[0] === '—' ? '—' : arr.map((t, i) => `${i + 1}. ${t}`).join('\n'));
const bulleted = (arr) => arr.map((t) => `- ${t}`).join('\n');

const out = `## ✨ New

${numbered(newItems)}

## 🐛 Fixes

${bulleted(fixItems)}

## 🚀 Features

${bulleted(featItems)}

<details>
<summary>中文说明</summary>

### ✨ 新增

${numbered(newItems)}

### 🐛 修复

${bulleted(fixItems)}

### 🚀 功能

${bulleted(featItems)}

</details>

> Installation and usage: see the [README](https://github.com/IceCokei/troll-surveillance#quick-start).
`;

const dir = path.join('docs', 'releases');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `v${version}.md`);
fs.writeFileSync(file, out);
console.log(`generated ${file} from ${range}`);
