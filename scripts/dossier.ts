import fs from 'node:fs';
import path from 'node:path';
import { fetchProfilePosts, cleanPostText } from '../lib/collect/xposts';

interface AuthorSpec {
  handle: string;
  name: string;
  role: string;
  tags: string[];
}

/** 名单：iOS 越狱 / 漏洞研究 / 相关媒体。只抓公开主页，不做任何推断。 */
export const AUTHORS: AuthorSpec[] = [
  { handle: 'opa334dev', name: 'opa334 (Lars Fröder)', role: 'Dopamine / TrollStore 作者', tags: ['tool', 'jailbreak'] },
  { handle: 'calif_io', name: 'Calif.io', role: '安全公司，Chollima 链，Hexacon 2026 演示', tags: ['research', 'untether'] },
  { handle: 'thaidn', name: 'Thai Duong', role: 'Calif.io 创始人（前 Google 安全）', tags: ['research'] },
  { handle: 'lcfr_hax', name: 'LCFR', role: 'php2shell 发现者，Calif 团队', tags: ['research', 'web'] },
  { handle: 'coolstarorg', name: 'CoolStar', role: 'Chimera / Odyssey / libhooker', tags: ['tool'] },
  { handle: 'Pwn20wnd', name: 'Pwn20wnd', role: 'unc0ver 作者', tags: ['tool'] },
  { handle: 'sbingner', name: 'Sam Bingner', role: 'Cydia / Substitute 维护者', tags: ['tool'] },
  { handle: 'tihmstar', name: 'tihmstar', role: 'checkra1n 团队 / 旧版越狱', tags: ['tool', 'legacy'] },
  { handle: 'axi0mX', name: 'axi0mX', role: 'checkm8 bootROM 漏洞发现者', tags: ['exploit', 'legacy'] },
  { handle: 'qwertyoruiopz', name: 'Luca Todesco', role: 'Yalu / 早期 iOS 越狱', tags: ['exploit', 'legacy'] },
  { handle: 'theninjaprawn', name: 'Jamie Bishop', role: 'checkra1n / unc0ver 贡献者', tags: ['exploit'] },
  { handle: 'dhinakg', name: 'dhinakg', role: 'OTA delay / 越狱生态工具', tags: ['tool'] },
  { handle: 'alfiecg24', name: 'Alfie CG', role: 'TrollStore 贡献者', tags: ['tool'] },
  { handle: 'MineekDev', name: 'Mineek', role: 'palera1n 团队', tags: ['tool'] },
  { handle: 'llsc12', name: 'llsc12', role: 'palera1n 团队', tags: ['tool'] },
  { handle: 'i41nbeer', name: 'Ian Beer', role: 'Project Zero，iOS 内核漏洞', tags: ['exploit'] },
  { handle: '5aelo', name: 'Samuel Groß', role: 'Project Zero，WebKit/JSC', tags: ['exploit'] },
  { handle: '08Tc3wBB', name: '08Tc3wBB', role: 'iOS 漏洞研究', tags: ['exploit'] },
  { handle: 'pattern_F_', name: 'pattern-f', role: 'iOS 内核漏洞研究', tags: ['exploit'] },
  { handle: 'xina520', name: 'xina520', role: 'XinaA15 越狱', tags: ['tool'] },
  { handle: 'samg_is_a_ninja', name: 'Sam Gardner', role: 'unc0ver 团队', tags: ['tool'] },
  { handle: 'stek29', name: 'Stek29', role: 'Electra 越狱团队', tags: ['tool'] },
  { handle: 'nedwill', name: 'Ned Williamson', role: 'Project Zero，iOS 沙盒/内核', tags: ['exploit'] },
  { handle: 'brandonazad', name: 'Brandon Azad', role: 'Project Zero，iOS 攻击面', tags: ['exploit'] },
  { handle: 'FCE365', name: 'FCE365', role: '越狱媒体 / 教程（注意甄别夸张标题）', tags: ['media'] },
  { handle: 'iDownloadBlog', name: 'iDownloadBlog', role: '越狱与 Apple 新闻媒体', tags: ['media'] },
  { handle: 'iClarified', name: 'iClarified', role: '越狱教程与新闻媒体', tags: ['media'] },
];

const OUT_JSON = path.join(process.cwd(), 'data', 'dossier.json');
const OUT_MD = path.join(process.cwd(), 'docs', 'x-sources.md');
const CACHE = path.join(process.cwd(), 'data', 'xposts-cache.json');

function loadCache(): Record<string, { at: number; posts: any[] }> {
  try { return JSON.parse(fs.readFileSync(CACHE, 'utf8')); } catch { return {}; }
}

async function main() {
  const cache = loadCache();
  const result: any[] = [];
  const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const list = only.length ? AUTHORS.filter((a) => only.includes(a.handle)) : AUTHORS;

  for (const a of list) {
    const hit = cache[a.handle];
    const fresh = hit && Date.now() - hit.at < 6 * 3600 * 1000 && process.argv.includes('--use-cache');
    let posts = hit?.posts ?? [];
    if (!fresh) {
      try {
        posts = await fetchProfilePosts(a.handle, { limit: 12 });
        cache[a.handle] = { at: Date.now(), posts };
        console.log('ok   @' + a.handle + '  ' + posts.length + ' posts');
      } catch (e: any) {
        console.log('fail @' + a.handle + '  ' + String(e?.message || e).slice(0, 90));
        posts = hit?.posts ?? [];
      }
      await new Promise((r) => setTimeout(r, 1800));
    }
    result.push({ ...a, posts: posts.map((p: any) => ({ ...p, text: cleanPostText(p.text) })), fetchedAt: new Date().toISOString() });
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1));
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 1));

  const L: string[] = [];
  L.push('# iOS / 越狱作者 X 情报总表');
  L.push('');
  L.push('> 抓取时间：' + new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC ｜ 来源：各账号公开主页（经 r.jina.ai 读取）');
  L.push('> 仅收录抓取到的真实贴文；无 status 链接的条目只能引用主页，已在表中标注。');
  L.push('');
  const total = result.reduce((n, a) => n + a.posts.length, 0);
  L.push('共 ' + result.length + ' 个账号，' + total + ' 条贴文。');
  L.push('');

  for (const a of result) {
    L.push('## ' + a.name + ' (@' + a.handle + ')');
    L.push('');
    L.push('**身份**：' + a.role + ' ｜ **标签**：' + a.tags.join(' / '));
    L.push('');
    if (!a.posts.length) {
      L.push('_本次未抓到贴文（可能被限流或账号不可见）。主页：https://x.com/' + a.handle + '_');
      L.push('');
      continue;
    }
    L.push('| 日期 | 文案（截断） | 视频 | 链接 |');
    L.push('| --- | --- | --- | --- |');
    for (const p of a.posts) {
      const t = (p.text || '').replace(/\|/g, '\\|').slice(0, 150);
      L.push('| ' + (p.date || '未标注') + ' | ' + t + ' | ' + (p.video ? '有' : '—') + ' | ' + p.url + ' |');
    }
    L.push('');
  }

  fs.mkdirSync(path.dirname(OUT_MD), { recursive: true });
  fs.writeFileSync(OUT_MD, L.join('\n'));
  console.log('\nwrote ' + OUT_MD + ' (' + total + ' posts)');
}

main();
