import { NextResponse, type NextRequest } from 'next/server';

/** 允许用 ?lang=en&theme=light 直接分享/截图，同时把选择写回 cookie */
export function middleware(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const langParam = searchParams.get('lang');
  const themeParam = searchParams.get('theme');

  const lang = langParam === 'en' || langParam === 'zh' ? langParam : req.cookies.get('lang')?.value;
  const theme = themeParam === 'light' || themeParam === 'dark' ? themeParam : req.cookies.get('theme')?.value;

  const requestHeaders = new Headers(req.headers);
  if (lang) requestHeaders.set('x-lang', lang);
  if (theme) requestHeaders.set('x-theme', theme);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  if (langParam === 'en' || langParam === 'zh') res.cookies.set('lang', langParam, { path: '/', maxAge: 31536000 });
  if (themeParam === 'light' || themeParam === 'dark') res.cookies.set('theme', themeParam, { path: '/', maxAge: 31536000 });
  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|fonts/).*)'],
};
