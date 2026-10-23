#!/usr/bin/env node
/**
 * 从 git 提交自动生成 docs/releases/vX.Y.Z.md（项目模板格式）。
 * 用法：node scripts/gen-notes.mjs 0.2.6
 *
 * 提交正文里可以写一行 `zh: ...`，该行会成为中文段对应的条目；
 * 没写就退回英文标题（旧行为）。这样英文段与中文段各自是可读的语言。
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
// %x1f 分隔字段、%x1e 分隔记录，正文一起取出来用于读 zh: 行
const log = sh(`git log ${range} --no-merges --pretty=format:%s%x1f%b%x1e`);

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

const commits = log
  .split(String.fromCharCode(30))
  .map((c) => c.trim())
  .filter(Boolean)
  .map((record) => {
    const [subject, body = ''] = record.split(String.fromCharCode(31));
    const zhLine = body
      .split(String.fromCharCode(10))
      .map((l) => l.trim())
      .find((l) => /^zh[:：]\s*\S/.test(l));
    return {
      subject: (subject || '').trim(),
      zh: zhLine ? zhLine.replace(/^zh[:：]\s*/, '').trim() : '',
    };
  });

const buckets = { new: [], fix: [], feat: [] };
const zhBuckets = { new: [], fix: [], feat: [] };

for (const { subject, zh } of commits) {
  const m = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s*(.+)$/);
  if (!m) continue;
  const [, type, scope, text] = m;
  if (subject.startsWith('chore(release)')) continue;
  const bucket = TYPE[type];
  if (!bucket || bucket === 'skip') continue;
  const label = scope ? `**${scope}** — ${text}` : `**${text}**`;
  buckets[bucket].push(label.replace(/\.$/, ''));
  // 中文段：有 zh: 就用它，没有就沿用英文条目（不编造）
  const zhLabel = zh ? (scope ? `**${scope}** — ${zh}` : `**${zh}**`) : label;
  zhBuckets[bucket].push(zhLabel.replace(/\.$/, ''));
}

// 兜底：如果全是 chore/ci/docs，就把原始提交标题列进 New，避免正文空掉
const rawSubjects = commits.map((c) => c.subject).filter((x) => x && !x.startsWith('chore(release)'));
if (!buckets.new.length && !buckets.fix.length && !buckets.feat.length) {
  buckets.new = rawSubjects.slice(0, 8).map((x) => '**' + x + '**');
  zhBuckets.new = [...buckets.new];
}

const pick = (arr) => (arr.length ? arr : ['—']);

const numbered = (arr) => (arr.length === 1 && arr[0] === '—' ? '—' : arr.map((t, i) => `${i + 1}. ${t}`).join(String.fromCharCode(10)));
const bulleted = (arr) => arr.map((t) => `- ${t}`).join(String.fromCharCode(10));

const nl = String.fromCharCode(10);
const out = [
  '## ✨ New',
  '',
  numbered(pick(buckets.new)),
  '',
  '## 🐛 Fixes',
  '',
  bulleted(pick(buckets.fix)),
  '',
  '## 🚀 Features',
  '',
  bulleted(pick(buckets.feat)),
  '',
  '<details>',
  '<summary>中文说明</summary>',
  '',
  '### ✨ 新增',
  '',
  numbered(pick(zhBuckets.new)),
  '',
  '### 🐛 修复',
  '',
  bulleted(pick(zhBuckets.fix)),
  '',
  '### 🚀 功能',
  '',
  bulleted(pick(zhBuckets.feat)),
  '',
  '</details>',
  '',
  '> Installation and usage: see the [README](https://github.com/IceCokei/troll-surveillance#quick-start).',
  '',
].join(nl);

const dir = path.join('docs', 'releases');
fs.mkdirSync(dir, { recursive: true });
const file = path.join(dir, `v${version}.md`);
fs.writeFileSync(file, out);
console.log(`generated ${file} from ${range}`);
