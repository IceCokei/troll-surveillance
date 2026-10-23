/** 把分析器生成的中文 actionNote 映射成英文（覆盖模板句式） */
const RULES: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^仅情报价值：记录，不构成动作$/, () => 'intel only — record, no action'],
  [/^可用：(.+?) 支持你的 iOS (.+?) \/ (.+?)，按官方 release 说明升级$/, (m) => 'usable: ' + m[1] + ' supports iOS ' + m[2] + ' on ' + m[3] + '; upgrade per the official release'],
  [/^可用：（(.+)）$/, (m) => 'usable: ' + m[1]],
  [/^不适用：(.+?) 仅支持 (.+?)，覆盖不到你的设备$/, (m) => 'not applicable: ' + m[1] + ' only covers ' + m[2]],
  [/^第三方发版，需人工确认是否覆盖 (.+?) \/ iOS (.+)$/, (m) => 'third-party release; verify it covers ' + m[1] + ' on iOS ' + m[2]],
  [/^命中的是你的版本，但这是私有\/未发布链——只能记录，等披露$/, () => 'matches your build, but the chain is private/unreleased — record and wait'],
  [/^与你的版本相关，需确认是否有公开实现（当前工具矩阵无对应项）$/, () => 'relevant to your build; no public implementation in the tool matrix yet'],
  [/^针对更高版本，你的设备不适用$/, () => 'targets a newer build; not applicable to your device'],
  [/^旧版本漏洞，你的系统已修复且无法降级$/, () => 'older build exploit: fixed on your system and downgrade is impossible'],
  [/^未提及具体版本，需人工确认是否覆盖 (.+)$/, (m) => 'no version stated; verify coverage for ' + m[1] + ' manually'],
  [/^签名窗口变化：核对是否还能还原到你当前版本$/, () => 'signing window changed: check whether you can still restore your build'],
  [/^你当前版本仍在签名窗口，出问题可 DFU 还原$/, () => 'your build is still signed; a DFU restore is possible if something breaks'],
  [/^骗局模式：不要安装描述文件 \/ 不要输入 Apple ID$/, () => 'scam pattern: do not install a profile, do not enter your Apple ID'],
  [/^讨论版本低于你的系统且早已停签名，不可用$/, () => 'discusses a build below yours, long unsigned; unusable'],
  [/^仅情报价值：记录，不构成动作$/, () => 'intel only — record, no action'],
];

export function enNote(note: string): string {
  const s = String(note || '');
  for (const [re, fn] of RULES) {
    const m = s.match(re);
    if (m) return fn(m);
  }
  return s;
}

/** 分类标签 */
export const CAT_EN: Record<string, string> = {
  exploit: 'exploit',
  'tool-release': 'tool',
  'os-release': 'os',
  signing: 'signing',
  wiki: 'wiki',
  news: 'news',
  scam: 'scam',
};

export function agoEn(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

/** 去掉中文前缀（词条快照 / 词条更新 / Update / Meta） */
export function cleanTitleEn(t: string): string {
  return String(t || '').replace(/^[(?:词条快照|词条更新|Update|Meta)]s*/i, '').trim();
}

const ROLE_EN: Record<string, string> = {
  opa334: 'Dopamine / TrollStore author',
  calif_io: 'Security firm; Chollima chain; Hexacon 2026 demo',
  tihmstar: 'iOS security researcher',
  lcffr_hax: 'Researcher',
  coolstarorg: 'Chimera / Odyssey author',
  sbingner: 'checkm8 / libimobiledevice contributor',
  verygenericname: 'TrollStore contributor',
  Lessica: 'TrollFools / TrollSpeed author',
  dhinakg: 'Researcher',
  '82Flex': 'RootHide contributor',
  roothideDev: 'RootHide author',
  '0x88FFA357': 'Researcher',
  Lakr233: 'Researcher',
};

export function roleEn(handle: string, fallback: string): string {
  const mapped = ROLE_EN[handle.replace(/^x:/, '')];
  if (mapped) return mapped;
  const text = roleTextEn(fallback);
  if (!/[\u4e00-\u9fff]/.test(text)) return text;
  return 'iOS security researcher';
}

/** 状态类标题的英文 */
export function stateTitleEn(t: string): string {
  const s = String(t || '');
  let m = s.match(/^\[词条快照\]\s*(.+)$/);
  if (m) return '[wiki] ' + m[1];
  m = s.match(/^\[词条更新\]\s*(.+)$/);
  if (m) return '[wiki update] ' + m[1];
  m = s.match(/^Apple 安全更新公告：(.*)$/);
  if (m) return 'Apple security update: ' + m[1];
  m = s.match(/^Apple 安全公告：(.*)$/);
  if (m) return 'Apple security advisory: ' + m[1];
  m = s.match(/^(.+?) 签名状态：(.+?)（最新 (.+?)，(仍在签名|已停签名)）$/);
  if (m) return m[1] + ' signing: ' + m[2] + ' (latest ' + m[3] + ', ' + (m[4] === '仍在签名' ? 'still signed' : 'unsigned') + ')';
  return s;
}


const ROLE_TEXT_EN: Record<string, string> = {
  'Dopamine / TrollStore 作者': 'Dopamine / TrollStore author',
  'Calif.io 创始人（前 Google 安全）': 'Calif.io founder (ex-Google security)',
  'php2shell 发现者，Calif 团队': 'php2shell finder, Calif team',
  'unc0ver 作者': 'unc0ver author',
  'checkm8 作者': 'checkm8 author',
  'TrollStore 贡献者': 'TrollStore contributor',
  '安全研究者': 'security researcher',
  '安全公司，Chollima 链，Hexacon 2026 演示': 'Security firm; Chollima chain; Hexacon 2026 demo',
  'iOS 安全研究者': 'iOS security researcher',
  'checkm8 bootROM 漏洞发现者': 'checkm8 bootROM discoverer',
  'Yalu / 早期 iOS 越狱': 'Yalu / early iOS jailbreaks',
  'checkra1n / unc0ver 贡献者': 'checkra1n / unc0ver contributor',
  'palera1n 团队': 'palera1n team',
  'XinaA15 越狱': 'XinaA15 jailbreak',
  'unc0ver 团队': 'unc0ver team',
  'Electra 越狱团队': 'Electra jailbreak team',
  'Project Zero，iOS 内核漏洞': 'Project Zero; iOS kernel bugs',
  'iOS 内核漏洞研究': 'iOS kernel research',
  'iOS 漏洞研究': 'iOS vulnerability research',
  'Chimera / Odyssey / libhooker': 'Chimera / Odyssey / libhooker',
};

export function roleTextEn(role: string): string {
  return ROLE_TEXT_EN[role] || role;
}



/** 中文模式：把英文基准标题还原成中文 */
export function stateTitleZh(t: string): string {
  return String(t || '').replace(/^Apple security update: /, 'Apple 安全更新公告：');
}


/** 中文模式：正文里的英文基准短语还原 */
export function stateTextZh(t: string): string {
  return String(t || '').replace(/^Apple security update: /, 'Apple 安全更新公告：');
}


/** 英文模式：固件/签名摘要的英文 */
export function stateTextEn(t: string): string {
  const s = String(t || '');
  const m = s.match(/^最新固件 (.+?)；可刷版本：(.+?)；历史版本：(.+)$/);
  if (m) return 'Latest firmware ' + m[1] + '; signed: ' + m[2].replace('无', 'none') + '; history: ' + m[3].replace(/\(签名\)/g, ' (signed)').replace('全部未签名', 'all unsigned');
  return s;
}
