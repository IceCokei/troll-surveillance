/** X 贴文清洗 + iOS 相关度过滤：不相关的直接不采集 */
export function cleanXText(raw: string): string {
  let t = String(raw || '');
  // X 页面模板 / 登录引导
  t = t.replace(/##\s*Log in or sign up for X[\s\S]*$/i, ' ');
  t = t.replace(/Continue with (phone|Apple|Google)[\s\S]*$/i, ' ');
  t = t.replace(/Terms.{0,120}?X Corp\.[\s\S]*$/i, ' ');
  t = t.replace(/Scan to get the app[\s\S]*$/i, ' ');
  t = t.replace(/See what.s happening and join the conversation[\s\S]*$/i, ' ');
  // 互动计数、残留括号、转发前缀
  t = t.replace(/\[+\s*\[+\s*\d[\d.,\s]*[KM]?/g, ' ');
  t = t.replace(/\b\d+(?:\.\d+)?[KM]\b/g, ' ');
  t = t.replace(/\b\d+\s+\d+(?:\.\d+)?[KM]\b/g, ' ');
  t = t.replace(/^[\s\[\]()（）.,:：!！·—–-]+/, ' ');
  t = t.replace(/^\s*砍砍[!！]?\s*/g, ' ');
  t = t.replace(/^\s*[\w.\-]+@\s*/, ' ');
  // 折叠空白
  return t.replace(/\s+/g, ' ').trim();
}

const STRONG = /jailbreak|越狱|trollstore|trollfools|trollspeed|purekfd|coretrust|permasign|永久签名|sileo|cydia|zebra|bootstrap|rootless|rootful|tweak|dopamine|palera1n|checkra1n|checkm8|kfd|\bipa\b|\.tipa|impactor|sideload|dyld|amfi|entitlement|exploit|0day|zero[- ]day|cve-\d|kernel|kernelcache|sandbox|unsandbox|springboard|ios\s?\d|ipados|iphone|ipad|apple\s?(silicon|id)|dfu|shsh|blob|ota|signing|firmware|sep\b|pac\b|sptm|\bmie\b|xnu|roothide/i;

/** 反例：明显是别的领域（AI 模型、抽奖、日常吐槽） */
const OFFTOPIC = /(kimi|moonshot|开源模型|大模型|抽奖|谢谢大家|显卡|gpu 集群|llm|token 价格|体检|感冒|午饭|晚饭)/i;

export function isIosRelevant(text: string): boolean {
  const t = cleanXText(text);
  if (t.length < 16) return false;
  if (!STRONG.test(t)) return false;
  // 命中强关键词但同时明显是别的话题，且没有更高权重的技术词 → 丢掉
  if (OFFTOPIC.test(t) && !/jailbreak|越狱|trollstore|exploit|cve-\d|kernel|dopamine|palera1n|checkm8/i.test(t)) return false;
  return true;
}
