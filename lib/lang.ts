import { headers, cookies } from 'next/headers';
import type { Lang } from './i18n';

/**
 * 语言解析：优先读 middleware 注入的 x-lang（支持 ?lang=en 直链，无需 cookie），
 * 其次读 cookie。这样首次带参访问也是正确语言。
 */
export async function getLang(): Promise<Lang> {
  const h = await headers();
  const v = h.get('x-lang');
  if (v === 'en' || v === 'zh') return v;
  const c = (await cookies()).get('lang')?.value;
  return c === 'en' ? 'en' : 'zh';
}
