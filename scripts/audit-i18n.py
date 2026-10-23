#!/usr/bin/env python3
"""英文页面中文泄漏检查：访问本地站点，统计 ?lang=en 下渲染文本中的中文行。

用法：
  python3 scripts/audit-i18n.py                 # 默认 http://127.0.0.1:3210
  BASE=http://127.0.0.1:3000 python3 scripts/audit-i18n.py --strict

--strict 模式：只要出现中文就返回非 0（CI 用），内容型中文写在 ALLOW 里。
"""
import os
import re
import sys
import urllib.request

BASE = os.environ.get('BASE', 'http://127.0.0.1:3210')
PAGES = ['/', '/feed', '/devices', '/sources', '/authors', '/tools', '/exploits', '/digest']

# 允许出现中文的行（来源内容 / 语言切换按钮 / 数据里的原文）
ALLOW = [
    r'^中$',
    r'^源$',
    r'[“”"]?popped the iPhone',
    r'relaxin|Relaxin',
    r'^[\u3040-\u30ff]+',          # 日文帖
    r'This post is unavailable',
]


def fetch(path: str) -> str:
    req = urllib.request.Request(BASE + path, headers={'User-Agent': 'i18n-audit'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


def text_lines(html: str):
    h = re.sub(r'<script[\s\S]*?</script>', ' ', html)
    h = re.sub(r'<style[\s\S]*?</style>', ' ', h)
    h = re.sub(r'<[^>]+>', '\n', h)
    h = h.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&#x27;', "'")
    return [l.strip() for l in h.split('\n') if l.strip()]


def main() -> int:
    strict = '--strict' in sys.argv
    total = 0
    for p in PAGES:
        try:
            html = fetch(p + ('&' if '?' in p else '?') + 'lang=en')
        except Exception as e:  # noqa: BLE001
            print(f'{p} FETCH FAIL {e}')
            total += 1
            continue
        cjk = [l for l in text_lines(html) if re.search(r'[\u4e00-\u9fff]', l)]
        bad = [l for l in cjk if not any(re.search(a, l) for a in ALLOW)]
        total += len(bad)
        flag = 'OK ' if not bad else 'CJK'
        print(f'{flag} {p:<10} allowed={len(cjk) - len(bad):<3} leaked={len(bad)}')
        for l in bad[:5]:
            print('     ', l[:96])
    print(f'\ntotal leaked lines: {total}')
    if strict and total:
        print('::error::Chinese leaked into English pages')
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
