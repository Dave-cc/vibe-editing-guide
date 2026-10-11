# -*- coding: utf-8 -*-
"""把 src/*.html 章节片段拼成成品页面。用法：python build.py"""
import re, os, io, html, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')

NAV = [
    ('开始', [('index', '这份手册怎么用'), ('anatomy', '一条视频的解剖')]),
    ('镜头语言', [('frame', '景别、角度与构图'), ('light-color', '光与色'), ('camera', '运镜')]),
    ('剪辑', [('cut', '切点与连贯'), ('rhythm', '蒙太奇、节奏与转场'), ('sound', '声音')]),
    ('动效', [('motion', '动效的底层规律'), ('type', '文字、图形与片头'), ('styles', '画风图鉴')]),
    ('审美', [('directors', '向导演和频道学'), ('taste', '什么叫好'), ('structure', '排片')]),
    ('落到嘴上', [('recipes', '一键动效 Prompt'), ('brief', '对 AI 说话'), ('glossary', '术语速查'), ('sources', '片单与出处')]),
]
ORDER = [(k, t) for _, items in NAV for k, t in items]

ICON = {
    'note': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 7.6v.4"/></svg>',
    'tip': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2.2h5c.1-1 .5-1.700 1.100-2.200A6 6 0 0 0 12 3z"/></svg>',
    'warn': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4 2.800 19.500h18.400L12 4z"/><path d="M12 10v4.500M12 17v.3"/></svg>',
    'spark': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.500l1.900 5.800a3 3 0 0 0 1.900 1.900l5.700 1.800-5.700 1.900a3 3 0 0 0-1.900 1.900L12 21.500l-1.900-5.700a3 3 0 0 0-1.900-1.900L2.500 12l5.700-1.800a3 3 0 0 0 1.900-1.900L12 2.500z"/></svg>',
    'copy': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/></svg>',
}
COPY = '<button class="copy" title="复制" aria-label="复制">%s</button>' % ICON['copy']


def attrs(s):
    return dict(re.findall(r'([\w-]+)="([^"]*)"', s))


def cap(a):
    c = a.get('cap', '')
    f = a.get('from', '')
    if not c and not f:
        return ''
    return '<figcaption>%s%s</figcaption>' % (c, '<span class="src">%s</span>' % f if f else '')


def fig(m):
    a = attrs(m.group(1))
    return '<figure%s><img loading="lazy" src="assets/img/%s" alt="%s">%s</figure>' % (
        ' class="%s"' % a['class'] if 'class' in a else '', a['src'], html.escape(re.sub('<.*?>', '', a.get('cap', ''))), cap(a))


def vid(m):
    a = attrs(m.group(1))
    src = a['src']
    poster = os.path.splitext(src)[0] + '.jpg'
    p = ' poster="assets/video/%s"' % poster if os.path.exists(os.path.join(ROOT, 'assets', 'video', poster)) else ''
    sound = 'sound' in a
    tag = '<span class="vtag">%s</span>' % ('有声 · 点击播放' if sound else '片段 · 循环')
    v = '<video src="assets/video/%s"%s %s playsinline preload="none"></video>' % (
        src, p, 'controls' if sound else 'controls muted loop data-auto')
    return '<figure%s><div class="vwrap">%s%s</div>%s</figure>' % (
        ' class="%s"' % a['class'] if 'class' in a else '', v, tag, cap(a))


def ai(m):
    body = m.group(1)
    out = ['<div class="ai"><div class="hd">%s对 AI 这样说</div>' % ICON['spark']]
    for tag, label in (('no', '别这么说'), ('yes', '这么说'), ('why', '为什么')):
        for x in re.findall(r'<%s>(.*?)</%s>' % (tag, tag), body, re.S):
            out.append('<div class="row %s"><span>%s</span><div>%s%s</div></div>' % (tag, label, x.strip(), COPY if tag == 'yes' else ''))
    out.append('</div>')
    return ''.join(out)


def callout(kind):
    def f(m):
        return '<div class="co %s">%s<div>%s</div></div>' % (kind, ICON[kind], m.group(1).strip())
    return f


def rx(m):
    a = attrs(m.group(1))
    stage = '<div class="rxs" data-rx="%s" title="点击重播"></div>' % a['demo'] if 'demo' in a else ''
    return '<div class="rx%s">%s<div class="rxb"><b>%s</b><span>%s</span><div class="rxp">%s%s</div></div></div>' % (
        '' if stage else ' wide', stage, a.get('t', ''), a.get('use', ''), m.group(2).strip(), COPY)


def transform(s):
    s = re.sub(r'<rx\s+((?:[^>"]|"[^"]*")*?)>(.*?)</rx>', rx, s, flags=re.S)
    s = s.replace('<rxg>', '<div class="rxg">').replace('</rxg>', '</div>')
    s = re.sub(r'<fig\s+((?:[^>"]|"[^"]*")*?)/>', fig, s)
    s = re.sub(r'<vid\s+((?:[^>"]|"[^"]*")*?)/>', vid, s)
    s = re.sub(r'<ai>(.*?)</ai>', ai, s, flags=re.S)
    for k in ('note', 'tip', 'warn'):
        s = re.sub(r'<%s>(.*?)</%s>' % (k, k), callout(k), s, flags=re.S)
    s = re.sub(r'<term en="([^"]*)">(.*?)</term>', r'<span class="term">\2<small>\1</small></span>', s)
    s = re.sub(r'<grid n="(\d)"([^>]*)>', r'<div class="grid g\1"\2>', s).replace('</grid>', '</div>')
    s = re.sub(r'<table>', '<div class="tw"><table>', s).replace('</table>', '</table></div>')
    s = re.sub(r'<pre([^>]*)>', lambda m: '<pre%s>%s' % (m.group(1), COPY), s)
    # headings get ids
    n = [0]

    def hid(m):
        n[0] += 1
        return '<%s id="s%d">%s</%s>' % (m.group(1), n[0], m.group(2), m.group(1))
    s = re.sub(r'<(h[23])>(.*?)</h[23]>', hid, s)
    return s


TPL = io.open(os.path.join(ROOT, 'assets', 'template.html'), encoding='utf-8').read()


def nav_html(cur):
    out = []
    i = 0
    for group, items in NAV:
        out.append('<h6>%s</h6>' % group)
        for k, t in items:
            i += 1
            out.append('<a href="%s.html"%s><i>%02d</i>%s</a>' % (k, ' class="on"' if k == cur else '', i - 1, t))
    return ''.join(out)


def main():
    missing = []
    for idx, (key, title) in enumerate(ORDER):
        p = os.path.join(SRC, key + '.html')
        if not os.path.exists(p):
            missing.append(key)
            continue
        raw = io.open(p, encoding='utf-8').read()
        meta = dict(re.findall(r'<!--\s*(\w+):\s*(.*?)\s*-->', raw))
        raw = raw.replace('@@SOURCES@@', io.open(os.path.join(SRC, '_sources_rows.html'), encoding='utf-8').read() if '@@SOURCES@@' in raw else '')
        body = transform(re.sub(r'<!--.*?-->', '', raw, flags=re.S))
        group = [g for g, items in NAV if key in [k for k, _ in items]][0]
        pn = ''
        if idx > 0:
            pn += '<a href="%s.html"><small>上一章</small><b>%s</b></a>' % ORDER[idx - 1]
        if idx < len(ORDER) - 1:
            pn += '<a class="nx" href="%s.html"><small>下一章</small><b>%s</b></a>' % ORDER[idx + 1]
        page = (TPL.replace('{{title}}', meta.get('title', title)).replace('{{lede}}', meta.get('lede', ''))
                .replace('{{group}}', group).replace('{{nav}}', nav_html(key)).replace('{{body}}', body).replace('{{pn}}', pn))
        io.open(os.path.join(ROOT, key + '.html'), 'w', encoding='utf-8').write(page)
        # 素材引用检查
        for ref in re.findall(r'(?:src|poster)="(assets/[^"]+)"', page):
            if not os.path.exists(os.path.join(ROOT, ref)):
                print('  [缺素材] %s -> %s' % (key, ref))
        txt = re.sub(r'<[^>]+>', '', body)
        print('%-12s %6d 字  图 %d  视频 %d' % (key, len(re.findall(r'[一-鿿]', txt)), page.count('<img '), page.count('<video ')))
    if missing:
        print('未写:', ', '.join(missing))


if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    main()
