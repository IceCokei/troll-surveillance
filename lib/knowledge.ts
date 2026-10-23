import type { Profile, Tool } from './types';

/** 默认设备档案：占位示例。首次运行请在 /tools 改成你自己的设备（或连接设备自动读取） */
export const DEFAULT_PROFILE: Profile = {
  name: 'iPhone 15 Pro',
  identifier: 'iPhone16,1',
  version: '17.3.1',
  build: '21E236',
  soc: 'A17 Pro (t8130)',
};

/** 公开工具矩阵：只有 public=true 且版本/SoC 命中，才算"可立即使用" */
export const TOOLS: Tool[] = [
  {
    name: 'Dopamine',
    kind: 'jailbreak',
    public: true,
    minVersion: '15.0',
    maxVersion: '17.3.1',
    maxVersionBySoc: { A12: '26.0.1', A13: '26.0.1' },
    socs: ['A12', 'A13', 'A14', 'A15', 'A16', 'A17'],
    note: 'rootless、semi-untethered。A12/A13 到 26.0.1；A14-A17 到 17.3.1；A18 及以后无支持',
    noteEn: 'rootless, semi-untethered. A12/A13 up to 26.0.1; A14-A17 up to 17.3.1; A18 and later unsupported',
    repo: 'opa334/Dopamine',
    url: 'https://github.com/opa334/Dopamine',
  },
  {
    name: 'palera1n',
    kind: 'jailbreak',
    public: true,
    maxVersion: '26.x',
    socs: ['A8', 'A9', 'A10', 'A11'],
    devices: 'iPhone 6s ~ iPhone X',
    note: 'checkm8 bootROM 漏洞，USB/DFU 引导，重启需重连电脑；rootful/rootless 可选',
    noteEn: 'checkm8 bootROM bug, USB/DFU boot, needs a computer after every reboot; rootful or rootless',
    repo: 'palera1n/palera1n',
    url: 'https://github.com/palera1n/palera1n',
  },
  {
    name: 'TrollStore',
    kind: 'sideload',
    public: true,
    maxVersion: '17.0',
    socs: ['A12', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18'],
    note: '依赖 CoreTrust 漏洞做永久签名；iOS 27.x 无可用 CoreTrust 缺陷',
    noteEn: 'permanent signing via the CoreTrust bug; no usable CoreTrust flaw on iOS 27.x',
    repo: 'opa334/TrollStore',
    url: 'https://github.com/opa334/TrollStore',
  },
  {
    name: 'Relaxin',
    kind: 'jailbreak',
    public: true,
    minVersion: '16.5',
    maxVersion: '18.7.1',
    socs: ['A12', 'A13', 'A14', 'A15', 'A16', 'A17'],
    ranges: [
      { socs: ['A12', 'A13'], min: '16.5', max: '18.7.1' },
      { socs: ['A12', 'A13'], min: '26.0', max: '26.0.1' },
      { socs: ['A14', 'A15', 'A16', 'A17'], min: '16.5', max: '17.3.1' },
    ],
    note: 'OwnGoal Studio 的 roothide 半越狱（基于 Dopamine），public beta；另有 .tipa 供 iOS 17.0 通过 TrollStore 安装；不支持 M 系 iPad',
    noteEn: 'roothide semi-jailbreak by OwnGoal Studio (based on Dopamine), public beta; also ships a .tipa for iOS 17.0 via TrollStore; M-series iPads unsupported',
    url: 'https://relaxin.owngoal.dev/',
  },
  {
    name: 'Chollima',
    kind: 'tweak-runner',
    public: false,
    minVersion: '27.0.1',
    maxVersion: '27.0.1',
    socs: ['A20'],
    devices: 'iPhone 18 Pro (iPhone19,2) 演示',
    note: 'calif.io 私有链：untether + 沙盒逃逸 + 内核漏洞 + MIE 绕过 + WebAssembly tweak runner，未发布',
    noteEn: 'private calif.io chain: untether + sandbox escape + kernel exploit + MIE bypass + WebAssembly tweak runner, unreleased',
    url: 'https://theapplewiki.com/wiki/Chollima',
  },
  {
    name: 'AltStore / SideStore',
    kind: 'sideload',
    public: true,
    socs: [],
    note: '免费开发者证书侧载，7 天续签，最多 3 个 App；非越狱，无 root',
    noteEn: 'free developer-cert sideloading, re-sign every 7 days, 3 apps max; not a jailbreak, no root',
    url: 'https://altstore.io',
  },
];

/** 供 X / RSS 监控的账号与仓库 */
export const X_HANDLES = [
  'opa334dev',
  'calif_io',
  'thaidn',
  'lcfr_hax',
  'coolstarorg',
  'sbingner',
  // TrollStore 生态作者
  'verygenericname',
  'Lessica',
  'dhinakg',
  // Relaxin / roothide 团队
  '82Flex',
  'roothideDev',
  '0x88FFA357',
  'Lakr233',
];

export const GITHUB_REPOS = [
  'opa334/Dopamine',
  'opa334/TrollStore',
  'palera1n/palera1n',
];

export const RSS_FEEDS = [
  { url: 'https://www.idownloadblog.com/feed/', name: 'iDownloadBlog' },
  { url: 'https://www.iclarified.com/rss/rss.xml', name: 'iClarified' },
  { url: 'https://www.reddit.com/r/jailbreak/.rss', name: 'r/jailbreak' },
  { url: 'https://www.reddit.com/r/Trollstore/.rss', name: 'r/Trollstore' },
  { url: 'https://developer.apple.com/news/rss/news.rss', name: 'Apple News' },
];

export const WIKI_PAGES = ['Chollima', 'Jailbreak', 'Dopamine', 'Palera1n', 'TrollStore'];

/** 设备坐标：识别文本里提到的机型和 SoC */
export const SOC_PATTERNS: { re: RegExp; soc: string }[] = [
  { re: /iPhone\s*18|iPhone19,\d|A20/i, soc: 'A20' },
  { re: /iPhone\s*17|iPhone18,\d|A19/i, soc: 'A19' },
  { re: /iPhone\s*16|iPhone17,\d|A18/i, soc: 'A18' },
  { re: /iPhone\s*15|iPhone16,\d|A17/i, soc: 'A17' },
  { re: /iPhone\s*14|iPhone15,\d|A16/i, soc: 'A16' },
  { re: /iPhone\s*1[123]|iPhone1[45],\d|A15|A14/i, soc: 'A14' },
  { re: /\bA1[23]\b|iPhone1[1-2],\d/i, soc: 'A12' },
  { re: /\bA1[01]\b|\bA9\b|\bA8\b|checkm8|iPhone1[0],\d|iPhone[89],\d/i, soc: 'A11' },
];
