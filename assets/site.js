(function () {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  // 主题与目录
  $('#themeBtn').onclick = () => {
    const d = document.documentElement, t = d.dataset.theme === 'dark' ? 'light' : 'dark';
    d.dataset.theme = t; try { localStorage.setItem('theme', t) } catch (e) { }
  };
  $('#menuBtn').onclick = () => document.body.classList.toggle('open');
  const on = $('.nav a.on'); if (on) on.scrollIntoView({ block: 'center' });
  const heads = $$('#doc h2, #doc h3'), toc = $('#toc');
  if (heads.length > 1) {
    toc.innerHTML = '<b>本页内容</b>' + heads.map(h => `<a class="${h.tagName.toLowerCase()}" href="#${h.id}">${h.textContent}</a>`).join('');
    const links = $$('a', toc);
    const spy = () => {
      let i = 0; heads.forEach((h, k) => { if (h.getBoundingClientRect().top < 120) i = k });
      links.forEach((a, k) => a.classList.toggle('on', k === i));
    };
    addEventListener('scroll', spy, { passive: true }); spy();
  }
  // 复制
  document.addEventListener('click', e => {
    const b = e.target.closest('.copy'); if (!b) return;
    const box = b.parentElement.cloneNode(true); $$('.copy', box).forEach(x => x.remove());
    const text = box.innerText.trim();
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).catch(() => {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }).finally(() => { b.classList.add('done'); setTimeout(() => b.classList.remove('done'), 1200) });
  });
  // 静音片段：进入视野自动播，离开暂停
  const io = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target; if (e.isIntersecting) { v.play().catch(() => { }) } else v.pause();
  }), { threshold: .45 });
  $$('video[data-auto]').forEach(v => io.observe(v));

  // ---------- 演示 ----------
  const mk = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n };
  function shell(el, title, hint, low) {
    el.classList.add('demo');
    const dh = mk('div', 'dh', `<b>${title}</b><span>${hint || ''}</span>`), stage = mk('div', 'stage' + (low ? ' low' : '')), bar = mk('div', 'bar'), say = mk('div', 'say');
    el.append(dh, stage, bar, say); return { stage, bar, say };
  }
  function buttons(bar, items, fn, first = 0) {
    items.forEach((it, i) => {
      const b = mk('button', '', it.n); b.onclick = () => { $$('button', bar).forEach(x => x.classList.remove('on')); b.classList.add('on'); fn(it) };
      bar.append(b);
    });
    const start = () => bar.children[first] && bar.children[first].click();
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { start(); o.disconnect() } }, { rootMargin: '200px' }).observe(bar.parentElement);
  }
  const E = { io: 'cubic-bezier(.65,0,.35,1)', out: 'cubic-bezier(.16,1,.3,1)', in: 'cubic-bezier(.7,0,.84,0)', lin: 'linear', back: 'cubic-bezier(.34,1.56,.64,1)' };

  // 运镜
  $$('[data-demo="camera"]').forEach(el => {
    const { stage, bar, say } = shell(el, '虚拟运镜', '同一张画面，换不同的镜头运动');
    const img = mk('img'); img.src = el.dataset.img; stage.append(img); stage.style.perspective = '900px';
    let an;
    const run = (kf, o) => { if (an) an.cancel(); an = img.animate(kf, Object.assign({ duration: 3200, easing: E.io, fill: 'both', iterations: Infinity, direction: 'alternate' }, o)) };
    const shake = () => { const k = []; for (let i = 0; i <= 24; i++)k.push({ transform: `scale(1.08) translate(${(Math.random() - .5) * 2.2}%,${(Math.random() - .5) * 2.2}%) rotate(${(Math.random() - .5) * .9}deg)` }); k[24] = k[0]; return k };
    buttons(bar, [
      { n: '固定', s: '<b>固定机位</b>，画面完全不动。让内容自己说话，适合信息重、要读字的镜头。', f: () => run([{ transform: 'none' }, { transform: 'none' }]) },
      { n: '慢推', s: '<b>缓慢推近</b>（slow push in），4 秒从 100% 到 108%，匀速或轻微缓出。最常用的“让静图活起来”，暗示“注意这里”。', f: () => run([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }], { duration: 4200, easing: 'linear' }) },
      { n: '拉远', s: '<b>拉远</b>（pull out），从局部退到全貌。用来揭示环境、收尾、或“原来如此”。', f: () => run([{ transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 3600 }) },
      { n: '急推', s: '<b>急推</b>（crash zoom / snap zoom），0.25 秒冲到 150%，强缓出。强调、吐槽、反应，喜剧和口播里常见。', f: () => run([{ transform: 'scale(1)', offset: 0 }, { transform: 'scale(1)', offset: .55 }, { transform: 'scale(1.55)', offset: .64, easing: E.out }, { transform: 'scale(1.55)', offset: 1 }], { duration: 2600, direction: 'normal', easing: 'linear' }) },
      { n: '横摇', s: '<b>横摇</b>（pan），机位不动，镜头水平转。交代空间、跟随视线、从 A 带到 B。', f: () => run([{ transform: 'scale(1.35) translateX(9%) rotateY(-5deg)' }, { transform: 'scale(1.35) translateX(-9%) rotateY(5deg)' }]) },
      { n: '俯仰', s: '<b>俯仰</b>（tilt），镜头上下转。从脚到头是“打量”，从人到天是“抒情/收尾”。', f: () => run([{ transform: 'scale(1.35) translateY(9%) rotateX(4deg)' }, { transform: 'scale(1.35) translateY(-9%) rotateX(-4deg)' }]) },
      { n: '横移', s: '<b>横移</b>（truck / tracking），整台机器平行移动，没有透视旋转。韦斯·安德森式的平移、长图横向浏览都是它。', f: () => run([{ transform: 'scale(1.3) translateX(11%)' }, { transform: 'scale(1.3) translateX(-11%)' }], { easing: 'linear' }) },
      { n: '手持', s: '<b>手持</b>（handheld），小幅不规则晃动。带来在场感、紧张感、纪实感；幅度大了就是“晕”。', f: () => run(shake(), { duration: 5200, easing: 'ease-in-out', direction: 'normal' }) },
      { n: '甩镜', s: '<b>甩镜</b>（whip pan），极快横摇加运动模糊，常当转场用：甩出去，接下一个镜头甩进来。', f: () => run([{ transform: 'scale(1.3) translateX(0)', filter: 'blur(0)', offset: 0 }, { transform: 'scale(1.3) translateX(0)', filter: 'blur(0)', offset: .6 }, { transform: 'scale(1.3) translateX(-10%)', filter: 'blur(9px)', offset: .68 }, { transform: 'scale(1.3) translateX(10%)', filter: 'blur(9px)', offset: .69 }, { transform: 'scale(1.3) translateX(0)', filter: 'blur(0)', offset: .78 }, { transform: 'scale(1.3)', offset: 1 }], { duration: 2800, direction: 'normal', easing: 'linear' }) },
      { n: '旋转', s: '<b>滚转</b>（roll / dutch），画面绕中心转。少量倾斜=不安，持续旋转=失控、眩晕、梦境。', f: () => run([{ transform: 'scale(1.4) rotate(-7deg)' }, { transform: 'scale(1.4) rotate(7deg)' }], { duration: 4200 }) },
    ], it => { it.f(); say.innerHTML = it.s }, 1);
  });

  // 转场
  $$('[data-demo="transition"]').forEach(el => {
    const { stage, bar, say } = shell(el, '转场', '每种转场说的话不一样');
    const a = mk('img'), b = mk('img'), veil = mk('div'); a.src = el.dataset.a; b.src = el.dataset.b;
    veil.style.cssText = 'position:absolute;inset:0;opacity:0;pointer-events:none'; stage.append(a, b, veil);
    let tm, anims = [];
    const reset = () => { anims.forEach(x => x.cancel()); anims = [];[a, b].forEach(x => { x.style.cssText = '' }); b.style.opacity = 0; veil.style.opacity = 0 };
    const A = (n, kf, o) => { const x = n.animate(kf, Object.assign({ duration: 600, fill: 'both', easing: E.io }, o)); anims.push(x); return x };
    const T = {
      cut: () => { b.style.opacity = 1 },
      dissolve: () => A(b, [{ opacity: 0 }, { opacity: 1 }], { duration: 1100, easing: 'linear' }),
      black: () => { veil.style.background = '#000'; A(veil, [{ opacity: 0 }, { opacity: 1, offset: .45 }, { opacity: 1, offset: .55 }, { opacity: 0 }], { duration: 1500, easing: 'linear' }); A(b, [{ opacity: 0 }, { opacity: 0, offset: .5 }, { opacity: 1, offset: .51 }, { opacity: 1 }], { duration: 1500 }) },
      flash: () => { veil.style.background = '#fff'; A(veil, [{ opacity: 0 }, { opacity: 1, offset: .3 }, { opacity: 0 }], { duration: 420, easing: 'ease-out' }); A(b, [{ opacity: 0 }, { opacity: 0, offset: .3 }, { opacity: 1, offset: .31 }, { opacity: 1 }], { duration: 420 }) },
      wipe: () => { b.style.opacity = 1; A(b, [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 700 }) },
      push: () => { b.style.opacity = 1; A(a, [{ transform: 'translateX(0)' }, { transform: 'translateX(-100%)' }], { duration: 650 }); A(b, [{ transform: 'translateX(100%)' }, { transform: 'translateX(0)' }], { duration: 650 }) },
      zoom: () => { A(a, [{ transform: 'scale(1)', filter: 'blur(0)' }, { transform: 'scale(3.2)', filter: 'blur(6px)' }], { duration: 380, easing: E.in }); A(b, [{ opacity: 0, transform: 'scale(.4)', filter: 'blur(6px)' }, { opacity: 0, transform: 'scale(.4)', offset: .49 }, { opacity: 1, transform: 'scale(.4)', filter: 'blur(6px)', offset: .5 }, { opacity: 1, transform: 'scale(1)', filter: 'blur(0)' }], { duration: 760, easing: 'linear' }) },
      whip: () => { A(a, [{ transform: 'translateX(0)', filter: 'blur(0)' }, { transform: 'translateX(-60%)', filter: 'blur(14px)' }], { duration: 220, easing: E.in }); A(b, [{ opacity: 0 }, { opacity: 0, offset: .49 }, { opacity: 1, transform: 'translateX(60%)', filter: 'blur(14px)', offset: .5 }, { opacity: 1, transform: 'translateX(0)', filter: 'blur(0)' }], { duration: 440, easing: 'linear' }) },
      iris: () => { b.style.opacity = 1; A(b, [{ clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)' }], { duration: 800 }) },
      glitch: () => { const k = []; for (let i = 0; i < 9; i++)k.push({ opacity: i % 2, transform: `translateX(${(Math.random() - .5) * 8}%) skewX(${(Math.random() - .5) * 20}deg)`, filter: `hue-rotate(${Math.random() * 180}deg) contrast(1.6)`, clipPath: `inset(${Math.random() * 60}% 0 ${Math.random() * 30}% 0)` }); k.push({ opacity: 1, transform: 'none', filter: 'none', clipPath: 'inset(0)' }); A(b, k, { duration: 420, easing: 'steps(10)' }) },
    };
    const play = it => { clearTimeout(tm); reset(); say.innerHTML = it.s; tm = setTimeout(() => { T[it.k](); tm = setTimeout(() => play(it), 2600) }, 1100) };
    buttons(bar, [
      { n: '硬切', k: 'cut', s: '<b>硬切</b>（cut）。零时长，默认选项，九成的剪辑点都该是它。它说的是“然后”。' },
      { n: '叠化', k: 'dissolve', s: '<b>叠化</b>（dissolve），两个画面交融 0.5–1.5 秒。它说的是“过了一段时间”或“这两件事有关联”。' },
      { n: '黑场', k: 'black', s: '<b>淡出到黑再淡入</b>（fade out / in）。一个段落结束，换章。全片用不了几次。' },
      { n: '白闪', k: 'flash', s: '<b>闪白</b>（flash），3–6 帧。卡在重拍上，用于回忆、拍照、冲击感，混剪常用。' },
      { n: '划像', k: 'wipe', s: '<b>划像</b>（wipe），一条边扫过去换画面。《星球大战》的标志；带复古、章节、漫画感。' },
      { n: '推移', k: 'push', s: '<b>推移</b>（push / slide），新画面把旧画面顶出去。暗示“旁边还有一个”，适合并列的条目。' },
      { n: '缩放', k: 'zoom', s: '<b>缩放穿越</b>（zoom through），冲进画面里再从下一个画面出来。旅拍、快节奏开场常用，容易用烂。' },
      { n: '甩镜', k: 'whip', s: '<b>甩镜转场</b>（whip pan），两个镜头同方向甩，用运动模糊盖住接缝。能量高，保持方向一致。' },
      { n: '圈入', k: 'iris', s: '<b>圈入圈出</b>（iris），默片时代的手法。现在用就是在说“我在致敬老电影/卡通”。' },
      { n: '故障', k: 'glitch', s: '<b>故障</b>（glitch），几帧的撕裂和色偏。只在科技、赛博、出错这类语境里成立。' },
    ], play, 0);
  });

  // 缓动
  $$('[data-demo="ease"]').forEach(el => {
    const { stage, bar, say } = shell(el, '缓动曲线', '同样的距离，同样的 0.8 秒', true);
    stage.style.cssText += 'background:var(--bg-soft);display:grid;align-content:center;gap:10px;padding:16px 22px';
    const rows = [['匀速 linear', E.lin], ['缓入 ease-in', E.in], ['缓出 ease-out', E.out], ['缓入缓出 ease-in-out', E.io], ['回弹 overshoot', E.back]];
    const dots = rows.map(([n]) => { const r = mk('div', '', `<span style="font:12px var(--sans);color:var(--ink-3);width:138px;flex:none">${n}</span><div style="flex:1;height:22px;position:relative;border-bottom:1px dashed var(--line-2)"><i style="position:absolute;left:0;top:2px;width:18px;height:18px;border-radius:50%;background:var(--accent-2)"></i></div>`); r.style.cssText = 'display:flex;align-items:center;gap:10px'; stage.append(r); return $('i', r) });
    let dur = 800, tm;
    const go = () => { dots.forEach((d, i) => { const w = d.parentElement.clientWidth - 18; d.getAnimations().forEach(x => x.cancel()); d.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${w}px)` }], { duration: dur, easing: rows[i][1], fill: 'both' }) }); clearTimeout(tm); tm = setTimeout(go, dur + 1100) };
    buttons(bar, [{ n: '0.2 秒', d: 200 }, { n: '0.4 秒', d: 400 }, { n: '0.8 秒', d: 800 }, { n: '1.6 秒', d: 1600 }], it => { dur = it.d; go(); say.innerHTML = it.d <= 200 ? '0.2 秒：按钮、小图标的反馈。再快就像闪。' : it.d <= 400 ? '0.4 秒：屏幕上大多数元素进场的舒服区间。' : it.d <= 800 ? '0.8 秒：整屏切换、大件物体。<b>匀速</b>那一行最像机器；<b>缓出</b>最像“东西落到位”。' : '1.6 秒：只有抒情、慢镜、背景漂移才用得上。给元素进场用这个时长，观众会等得烦。' }, 2);
  });

  // 进场方式
  $$('[data-demo="enter"]').forEach(el => {
    const { stage, bar, say } = shell(el, '文字进场', '同一行字，六种进法');
    stage.style.cssText += 'display:grid;place-items:center;background:#141413';
    const txt = el.dataset.text || '好镜头自己会说话';
    let tm;
    const build = per => { stage.innerHTML = ''; const w = mk('div'); w.style.cssText = 'font:700 clamp(22px,4.6vw,44px)/1.2 var(--sans);color:#F4F1E8;letter-spacing:.04em;display:flex;overflow:hidden;padding:.15em .1em'; if (per) [...txt].forEach(c => { const s = mk('span', '', c); s.style.display = 'inline-block'; w.append(s) }); else w.textContent = txt; stage.append(w); return w };
    const M = {
      fade: () => build().animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, fill: 'both' }),
      up: () => build().animate([{ opacity: 0, transform: 'translateY(40px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: E.out, fill: 'both' }),
      pop: () => build().animate([{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 420, easing: E.back, fill: 'both' }),
      mask: () => { const w = build(true);[...w.children].forEach((s, i) => s.animate([{ transform: 'translateY(115%)' }, { transform: 'none' }], { duration: 560, delay: i * 38, easing: E.out, fill: 'both' })) },
      type: () => { const w = build(true);[...w.children].forEach((s, i) => s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 1, delay: i * 85, fill: 'both' })) },
      blur: () => { const w = build(true); w.style.overflow = 'visible';[...w.children].forEach((s, i) => s.animate([{ opacity: 0, filter: 'blur(12px)', transform: 'scale(1.3)' }, { opacity: 1, filter: 'blur(0)', transform: 'none' }], { duration: 620, delay: i * 45, easing: E.out, fill: 'both' })) },
    };
    const play = it => { clearTimeout(tm); M[it.k](); say.innerHTML = it.s; tm = setTimeout(() => play(it), 2600) };
    buttons(bar, [
      { n: '淡入', k: 'fade', s: '<b>淡入</b>（fade in）。最安静，不抢戏，字幕和注释用它。' },
      { n: '上滑', k: 'up', s: '<b>上滑淡入</b>（slide up + fade），位移 30–40 像素，缓出。UI 和产品片的默认进场。' },
      { n: '弹出', k: 'pop', s: '<b>缩放弹出</b>（scale pop / overshoot），先冲过头再回来。活泼，适合贴纸、数字、强调词。' },
      { n: '遮罩逐字', k: 'mask', s: '<b>遮罩上升逐字</b>（mask reveal, staggered），字从一条看不见的线下面升上来，每字错开 40 毫秒。标题的“高级感”多半来自它。' },
      { n: '打字机', k: 'type', s: '<b>打字机</b>（typewriter），一个字一个字敲出来。配键盘音效，适合引用、代码、提问。' },
      { n: '模糊聚焦', k: 'blur', s: '<b>模糊聚焦</b>（blur in），从虚到实、略微缩小落位。电影片头、Apple 式的柔和。' },
    ], play, 3);
  });

  // 错峰
  $$('[data-demo="stagger"]').forEach(el => {
    const { stage, bar, say } = shell(el, '错峰', '五个条目，间隔不同', true);
    stage.style.cssText += 'background:var(--bg-soft);display:flex;gap:12px;align-items:center;justify-content:center;padding:0 20px';
    const cards = [0, 1, 2, 3, 4].map(() => { const c = mk('div'); c.style.cssText = 'flex:1;max-width:120px;aspect-ratio:3/4;border-radius:10px;background:var(--bg-raise);border:1px solid var(--line-2);box-shadow:var(--shadow)'; stage.append(c); return c });
    let tm; const play = it => { clearTimeout(tm); cards.forEach((c, i) => { c.getAnimations().forEach(x => x.cancel()); c.animate([{ opacity: 0, transform: 'translateY(28px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: i * it.d, easing: E.out, fill: 'both' }) }); say.innerHTML = it.s; tm = setTimeout(() => play(it), 2400 + it.d * 5) };
    buttons(bar, [
      { n: '同时', d: 0, s: '间隔 0：五张一起到。像一整块板子，眼睛不知道先看谁。' },
      { n: '60 毫秒', d: 60, s: '间隔 <b>60 毫秒</b>（约 2 帧）：看得出先后，又不拖。列表、网格的常用值是 40–80 毫秒。' },
      { n: '150 毫秒', d: 150, s: '间隔 150 毫秒：每一张都被“念”了一遍，适合要逐条读的要点。' },
      { n: '400 毫秒', d: 400, s: '间隔 400 毫秒：已经不是错峰，是五次独立进场。除非配着口播一条一条讲，否则太慢。' },
    ], play, 1);
  });

  // 动画原则对照
  $$('[data-demo="principles"]').forEach(el => {
    const { stage, bar, say } = shell(el, '有它 / 没它', '左边没有，右边有', true);
    stage.style.cssText += 'background:var(--bg-soft);display:grid;grid-template-columns:1fr 1fr';
    const L = mk('div'), R = mk('div');[L, R].forEach(x => { x.style.cssText = 'position:relative;overflow:hidden'; stage.append(x) }); L.style.borderRight = '1px dashed var(--line-2)';
    const ball = p => { const b = mk('i'); b.style.cssText = 'position:absolute;left:calc(50% - 22px);bottom:14%;width:44px;height:44px;border-radius:50%;background:var(--accent-2);transform-origin:50% 100%'; p.append(b); return b };
    const box = p => { const b = mk('i'); b.style.cssText = 'position:absolute;left:12%;bottom:22%;width:54px;height:54px;border-radius:10px;background:var(--accent-2);transform-origin:50% 100%'; p.append(b); return b };
    let tm;
    const P = {
      squash: () => {
        const a = ball(L), b = ball(R), o = { duration: 1100, iterations: Infinity };
        a.animate([{ transform: 'translateY(-150%)', easing: E.in }, { transform: 'translateY(0)', easing: E.out }, { transform: 'translateY(-150%)' }], o);
        b.animate([{ transform: 'translateY(-150%) scale(.92,1.1)', easing: E.in }, { transform: 'translateY(0) scale(.86,1.2)', offset: .46 }, { transform: 'translateY(0) scale(1.3,.68)', offset: .5 }, { transform: 'translateY(-12%) scale(.86,1.2)', offset: .56, easing: E.out }, { transform: 'translateY(-150%) scale(.92,1.1)' }], o);
      },
      antic: () => {
        const a = box(L), b = box(R), o = { duration: 2000, iterations: Infinity };
        a.animate([{ transform: 'translateX(0)', offset: 0 }, { transform: 'translateX(0)', offset: .3 }, { transform: 'translateX(230%)', offset: .5, easing: E.out }, { transform: 'translateX(230%)', offset: 1 }], o);
        b.animate([{ transform: 'translateX(0)', offset: 0 }, { transform: 'translateX(0)', offset: .14 }, { transform: 'translateX(-26%) scale(.9,1.08)', offset: .3, easing: E.in }, { transform: 'translateX(250%) scale(1.12,.92)', offset: .46 }, { transform: 'translateX(222%)', offset: .54 }, { transform: 'translateX(230%)', offset: .6 }, { transform: 'translateX(230%)', offset: 1 }], o);
      },
      arc: () => {
        const a = ball(L), b = ball(R), o = { duration: 1700, iterations: Infinity, direction: 'alternate', easing: E.io };[a, b].forEach(x => { x.style.left = '12%'; x.style.width = x.style.height = '30px' });
        a.animate([{ transform: 'translate(0,0)' }, { transform: 'translate(520%,0)' }], o);
        const k = []; for (let i = 0; i <= 20; i++) { const t = i / 20; k.push({ transform: `translate(${t * 520}%,${-Math.sin(t * Math.PI) * 260}%)` }) } b.animate(k, o);
      },
      follow: () => {
        const tail = p => { const w = box(p); w.style.background = 'none'; w.innerHTML = '<b style="position:absolute;inset:0;border-radius:10px;background:var(--accent-2)"></b><u style="position:absolute;left:-34px;top:16px;width:40px;height:10px;border-radius:6px;background:var(--accent);transform-origin:100% 50%"></u>'; return w };
        const a = tail(L), b = tail(R), o = { duration: 2000, iterations: Infinity }, mv = [{ transform: 'translateX(0)', offset: 0 }, { transform: 'translateX(0)', offset: .2 }, { transform: 'translateX(230%)', offset: .45, easing: E.out }, { transform: 'translateX(230%)', offset: 1 }];
        a.animate(mv, o); b.animate(mv, o);
        $('u', b).animate([{ transform: 'rotate(0)', offset: 0 }, { transform: 'rotate(0)', offset: .2 }, { transform: 'rotate(-28deg)', offset: .3 }, { transform: 'rotate(34deg)', offset: .48 }, { transform: 'rotate(-14deg)', offset: .58 }, { transform: 'rotate(6deg)', offset: .68 }, { transform: 'rotate(0)', offset: .78 }, { transform: 'rotate(0)', offset: 1 }], o);
      },
    };
    buttons(bar, [
      { n: '挤压与拉伸', k: 'squash', s: '<b>挤压与拉伸</b>（squash & stretch）：落地压扁、弹起拉长，体积不变。物体有了重量和弹性；没有它就是一个在移动的图标。' },
      { n: '预备动作', k: 'antic', s: '<b>预备动作</b>（anticipation）：往右冲之前先往左缩一下，到位后再略微冲过头。观众的眼睛被提前带到了要发生事的地方。' },
      { n: '弧线', k: 'arc', s: '<b>弧线</b>（arcs）：自然界里几乎没有直线运动。走弧线的东西像被抛出去的，走直线的像被程序移过去的。' },
      { n: '跟随与重叠', k: 'follow', s: '<b>跟随与重叠</b>（follow through & overlapping）：主体停了，附属的部分还要再晃两下才停。不同部件不同时到位，画面就不“板”。' },
    ], it => { L.innerHTML = R.innerHTML = ''; P[it.k](); say.innerHTML = it.s }, 0);
  });

  // 调色
  $$('[data-demo="grade"]').forEach(el => {
    const { stage, bar, say } = shell(el, '调色', '同一帧，换一种“看法”');
    const img = mk('img'), ov = mk('div'); img.src = el.dataset.img; ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;transition:all .5s'; img.style.transition = 'filter .5s'; stage.append(img, ov);
    buttons(bar, [
      { n: '原片', f: 'none', o: '', s: '原片。先看清楚它本来的样子：哪里亮、哪里暗、肤色在哪。' },
      { n: '青橙', f: 'contrast(1.15) saturate(1.2)', o: 'background:linear-gradient(180deg,rgba(0,150,170,.28),rgba(255,140,40,.22));mix-blend-mode:soft-light', s: '<b>青橙</b>（teal & orange）：暗部推向青，肤色和高光推向橙。互补色让人物从背景里跳出来，好莱坞大片的默认配方。' },
      { n: '冷调低饱和', f: 'saturate(.55) contrast(1.12) brightness(.95)', o: 'background:rgba(40,80,130,.3);mix-blend-mode:soft-light', s: '<b>冷调低饱和</b>：饱和度降到六成，整体偏蓝青。冷静、疏离、悬疑，芬奇和北欧犯罪片的气质。' },
      { n: '暖黄怀旧', f: 'sepia(.35) saturate(1.25) contrast(1.05) brightness(1.04)', o: 'background:rgba(255,170,60,.22);mix-blend-mode:soft-light', s: '<b>暖黄</b>：色温往橙黄走，高光带点奶油色。回忆、家庭、夏天，《天使爱美丽》的那种童话感。' },
      { n: '褪色胶片', f: 'contrast(.82) saturate(.8) brightness(1.08)', o: 'background:linear-gradient(180deg,rgba(60,70,60,.25),rgba(120,90,60,.18));mix-blend-mode:screen', s: '<b>褪色</b>（faded / lifted blacks）：把最黑的地方抬成深灰，反差变软。日系、文艺、vlog 常见；用过头画面会发灰发脏。' },
      { n: '高反差黑白', f: 'grayscale(1) contrast(1.5) brightness(.95)', o: '', s: '<b>高反差黑白</b>：去掉颜色，只剩形状和光。画面元素太杂、颜色救不回来的时候，黑白常常是最干净的解。' },
      { n: '霓虹', f: 'contrast(1.25) saturate(1.7) hue-rotate(-18deg)', o: 'background:linear-gradient(120deg,rgba(255,0,150,.3),rgba(0,220,255,.3));mix-blend-mode:overlay', s: '<b>霓虹</b>：品红加青，饱和拉满。赛博朋克、夜店、王家卫的夜晚。只适合夜景和人造光。' },
    ], it => { img.style.filter = it.f; ov.style.cssText = 'position:absolute;inset:0;pointer-events:none;transition:all .5s;' + it.o; say.innerHTML = it.s }, 0);
  });

  // 画幅
  $$('[data-demo="ratio"]').forEach(el => {
    const { stage, bar, say } = shell(el, '画幅', '同一个画面装进不同的框');
    const img = mk('img'); img.src = el.dataset.img; img.style.filter = 'brightness(.35)'; const win = mk('div'); win.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:100%;height:100%;overflow:hidden;outline:2px solid var(--accent-2);transition:all .45s cubic-bezier(.16,1,.3,1)';
    const in2 = mk('img'); in2.src = el.dataset.img; in2.style.cssText = 'position:absolute;top:50%;left:50%;width:auto;height:auto;max-width:none;transform:translate(-50%,-50%)'; win.append(in2); stage.append(img, win);
    const fit = () => { in2.style.width = stage.clientWidth + 'px'; in2.style.height = stage.clientHeight + 'px' }; fit(); addEventListener('resize', fit);
    buttons(bar, [
      { n: '16:9', r: 16 / 9, s: '<b>16:9</b> 横屏。B 站、YouTube、电脑和电视。1920×1080 或 3840×2160。' },
      { n: '9:16', r: 9 / 16, s: '<b>9:16</b> 竖屏。抖音、视频号、小红书、Shorts。1080×1920。横拍素材放进来只剩中间一条，所以构图要提前想。' },
      { n: '3:4', r: 3 / 4, s: '<b>3:4</b>。小红书图文和视频的主流比例，信息流里占的面积比 9:16 更划算。' },
      { n: '1:1', r: 1, s: '<b>1:1</b> 方形。早期 Instagram 的遗产，现在主要用于信息流广告和封面。' },
      { n: '4:3', r: 4 / 3, s: '<b>4:3</b>。老电视、老电影的比例。现在用它是一种风格选择：复古、亲密、肖像感。' },
      { n: '2.39:1', r: 2.39, s: '<b>2.39:1</b> 宽银幕。“电影感”的黑边就是它。适合风景和横向调度，不适合手机上看字。' },
    ], it => { const sr = stage.clientWidth / stage.clientHeight; if (it.r >= sr) { win.style.width = '100%'; win.style.height = (sr / it.r * 100) + '%' } else { win.style.height = '100%'; win.style.width = (it.r / sr * 100) + '%' } say.innerHTML = it.s }, 0);
  });

  // 节奏
  $$('[data-demo="pace"]').forEach(el => {
    const { stage, bar, say } = shell(el, '剪辑节奏', '同一组镜头，换不同的镜头时长');
    const srcs = el.dataset.imgs.split(','), imgs = srcs.map(s => { const i = mk('img'); i.src = s.trim(); i.style.opacity = 0; stage.append(i); return i });
    const meter = mk('div'); meter.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:5px;display:flex;gap:2px;padding:0 2px;background:rgba(0,0,0,.5)'; stage.append(meter);
    let tm, token = 0;
    const play = it => {
      clearTimeout(tm); const my = ++token; say.innerHTML = it.s; meter.innerHTML = ''; const seq = it.seq, total = seq.reduce((a, b) => a + b, 0);
      const cells = seq.map(d => { const c = mk('i'); c.style.cssText = `flex:${d};background:rgba(255,255,255,.28);border-radius:2px`; meter.append(c); return c });
      let i = 0; const step = () => { if (my !== token) return; imgs.forEach((im, k) => im.style.opacity = k === i % imgs.length ? 1 : 0); cells.forEach((c, k) => c.style.background = k === i ? 'var(--accent-2)' : k < i ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.28)'); const d = seq[i]; i++; tm = setTimeout(() => { if (i >= seq.length) { i = 0; cells.forEach(c => c.style.background = 'rgba(255,255,255,.28)') } step() }, d * 1000) }; step();
    };
    buttons(bar, [
      { n: '每镜 3 秒', seq: [3, 3, 3, 3, 3, 3], s: '每镜 3 秒，匀速。从容，看得清，但六个镜头一样长，三轮之后人就开始走神。' },
      { n: '每镜 1 秒', seq: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], s: '每镜 1 秒，匀速。信息量上去了，但依然是节拍器，快得没有重点。' },
      { n: '每镜 0.4 秒', seq: Array(24).fill(.4), s: '每镜 0.4 秒。混剪、快闪的密度。每个镜头只能有一个一眼能认出的主体，否则就是一片闪。' },
      { n: '渐快', seq: [3, 2.2, 1.6, 1.1, .8, .55, .4, .3, .25, .25, .25, 2.6], s: '<b>渐快，最后停住</b>。3 秒起步，一路压到 0.25 秒，再用一个 2.6 秒的长镜头收住。紧张感是加速度给的，不是速度给的。' },
      { n: '长短交替', seq: [2.8, .5, .5, .5, 2.4, .4, .4, .4, .4, 3.2], s: '<b>长短交替</b>。一个长镜头交代，一串短镜头冲，再一个长镜头喘气。大多数“节奏好”的片子都是这个形状。' },
    ], play, 3);
  });

  // 景别裁切
  $$('[data-demo="size"]').forEach(el => {
    const { stage, bar, say } = shell(el, '景别', '从同一个画面里取不同的大小');
    const img = mk('img'); img.src = el.dataset.img; const [fx, fy] = (el.dataset.focus || '50,35').split(',').map(Number);
    img.style.transformOrigin = `${fx}% ${fy}%`; img.style.transition = 'transform .7s cubic-bezier(.16,1,.3,1)'; stage.append(img);
    const items = JSON.parse(el.dataset.items);
    buttons(bar, items, it => { img.style.transform = `scale(${it.z})`; say.innerHTML = it.s }, 0);
  });
})();
