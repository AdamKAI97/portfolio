/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · ui.js — иконки, окна, уведомления, блоки
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C;

/* ───────── Иконки (24×24, обводка) ───────── */
const P = {
  pulse:'M3 12h4l3-8 4 16 3-8h4',
  users:'M16 19v-1.6a3.4 3.4 0 00-3.4-3.4H6.4A3.4 3.4 0 003 17.4V19M9.5 10.6a3.3 3.3 0 100-6.6 3.3 3.3 0 000 6.6M21 19v-1.6a3.4 3.4 0 00-2.6-3.3M15.5 4.2a3.3 3.3 0 010 6.4',
  kanban:'M4 4h5v11H4zM10.5 4h5v16h-5zM17 4h3v7h-3z',
  calendar:'M4 6.5A1.5 1.5 0 015.5 5h13A1.5 1.5 0 0120 6.5v12a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 18.5zM4 10h16M8.5 3v4M15.5 3v4',
  book:'M5 4.5A1.5 1.5 0 016.5 3H19v15H6.5A1.5 1.5 0 005 19.5zM5 19.5A1.5 1.5 0 016.5 18H19v3H6.5A1.5 1.5 0 015 19.5z',
  wave:'M3 12h2.5l2-6 3 13 2.5-9 2 5 2-3H21',
  wallet:'M3 8.5A2.5 2.5 0 015.5 6h12A1.5 1.5 0 0119 7.5V9M3 8.5v8A2.5 2.5 0 005.5 19h13a1.5 1.5 0 001.5-1.5V11a1.5 1.5 0 00-1.5-1.5H16a2.5 2.5 0 000 5h4',
  chart:'M4 19V5M4 19h16M8 16V11M12.5 16V7.5M17 16v-3',
  gear:'M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4M19.4 14a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1v.3a2 2 0 11-4 0v-.2a1.6 1.6 0 00-2.8-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H3.4a2 2 0 110-4h.2A1.6 1.6 0 004.7 6.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V2.8a2 2 0 114 0V3a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7h.3a2 2 0 110 4h-.2a1.6 1.6 0 00-1.5 1z',
  plus:'M12 5v14M5 12h14',
  check:'M4.5 12.5l5 5 10-11',
  x:'M6 6l12 12M18 6L6 18',
  edit:'M4 20h4L19 9a2.1 2.1 0 00-3-3L5 17v3zM14.5 6.5l3 3',
  trash:'M4 7h16M9.5 7V4.8A.8.8 0 0110.3 4h3.4a.8.8 0 01.8.8V7M6.5 7l.9 12.2a1.5 1.5 0 001.5 1.3h6.2a1.5 1.5 0 001.5-1.3L17.5 7M10 11v6M14 11v6',
  phone:'M6.2 3.5h3l1.5 4-2 1.4a12 12 0 006.4 6.4l1.4-2 4 1.5v3a1.6 1.6 0 01-1.8 1.6C11.5 19 5 12.5 4.6 5.3A1.6 1.6 0 016.2 3.5z',
  clock:'M12 7.5V12l3 1.8M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  money:'M12 6v12M14.8 8.6c-.4-1-1.5-1.6-2.9-1.6-1.8 0-2.9.9-2.9 2.2 0 3.2 6.2 1.6 6.2 4.9 0 1.5-1.3 2.4-3.2 2.4-1.6 0-2.8-.6-3.3-1.7',
  star:'M12 4l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z',
  left:'M14.5 5.5L8 12l6.5 6.5',
  right:'M9.5 5.5L16 12l-6.5 6.5',
  down:'M6 9.5l6 6 6-6',
  up:'M6 14.5l6-6 6 6',
  search:'M20 20l-3.6-3.6M18 11a7 7 0 11-14 0 7 7 0 0114 0z',
  inbox:'M4 13h4l1.5 3h5L16 13h4M4 13l2.5-8h11L20 13v5.5A1.5 1.5 0 0118.5 20h-13A1.5 1.5 0 014 18.5z',
  spark:'M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6zM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z',
  play:'M8 5.5l10 6.5-10 6.5z',
  pause:'M9 5v14M15 5v14',
  medal:'M12 14.5a5 5 0 100-10 5 5 0 000 10zM8.5 13.5L7 21l5-2.5L17 21l-1.5-7.5',
  download:'M12 4v11M7.5 11L12 15.5 16.5 11M4.5 19.5h15',
  upload:'M12 15.5v-11M7.5 9L12 4.5 16.5 9M4.5 19.5h15',
  warn:'M12 9v4.5M12 17h.01M10.3 4.2L2.8 17.5A1.9 1.9 0 004.5 20.4h15a1.9 1.9 0 001.7-2.9L13.7 4.2a1.9 1.9 0 00-3.4 0z',
  info:'M12 11v5.5M12 7.8h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  bell:'M6 9a6 6 0 1112 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9zM10 18.5a2 2 0 004 0',
  home:'M4 10.5L12 4l8 6.5V19a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19z',
  target:'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16.5a4.5 4.5 0 100-9 4.5 4.5 0 000 9zM12 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z',
  note:'M6 3.5h8L19 8v12.5A1.5 1.5 0 0117.5 22h-11A1.5 1.5 0 015 20.5v-16A1 1 0 016 3.5zM14 3.5V8h5M8.5 13h7M8.5 17h5',
  copy:'M9 9V5.5A1.5 1.5 0 0110.5 4h8A1.5 1.5 0 0120 5.5v8a1.5 1.5 0 01-1.5 1.5H15M4 10.5A1.5 1.5 0 015.5 9h8a1.5 1.5 0 011.5 1.5v8a1.5 1.5 0 01-1.5 1.5h-8A1.5 1.5 0 014 18.5z',
  heart:'M12 20s-7.5-4.6-7.5-9.4A4.1 4.1 0 0112 8.2a4.1 4.1 0 017.5 2.4C19.5 15.4 12 20 12 20z',
  brain:'M9.5 4.5A2.5 2.5 0 007 7v.2A2.5 2.5 0 005 9.6c0 .9.5 1.7 1.2 2.1A2.5 2.5 0 007 16.4v.1A2.5 2.5 0 0012 18V6a1.5 1.5 0 00-2.5-1.5zM14.5 4.5A2.5 2.5 0 0117 7v.2a2.5 2.5 0 012 2.4c0 .9-.5 1.7-1.2 2.1A2.5 2.5 0 0117 16.4v.1A2.5 2.5 0 0112 18',
  mic:'M12 15a3.5 3.5 0 003.5-3.5v-5a3.5 3.5 0 10-7 0v5A3.5 3.5 0 0012 15zM5.5 11.5a6.5 6.5 0 0013 0M12 18.5V21',
  cash:'M3 7.5A1.5 1.5 0 014.5 6h15A1.5 1.5 0 0121 7.5v9a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 16.5zM12 15a3 3 0 100-6 3 3 0 000 6z',
  card:'M3 8.5A2.5 2.5 0 015.5 6h13A2.5 2.5 0 0121 8.5v7a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 15.5zM3 10.5h18M6.5 14.5h3',
  transfer:'M4 8h13l-3-3M20 16H7l3 3',
  refresh:'M20 11.5A8 8 0 006 6.2L4 8M4 12.5a8 8 0 0014 5.3l2-1.8M4 4v4h4M20 20v-4h-4',
  filter:'M4 6h16l-6 7v5l-4 2v-7z',
  print:'M7 9V4h10v5M7 17H5.5A1.5 1.5 0 014 15.5v-4A1.5 1.5 0 015.5 10h13a1.5 1.5 0 011.5 1.5v4a1.5 1.5 0 01-1.5 1.5H17M7 14h10v6H7z',
  grid:'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  list:'M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01',
  link:'M10 13.5a4 4 0 005.7 0l2.8-2.8a4 4 0 10-5.7-5.7l-1.4 1.4M14 10.5a4 4 0 00-5.7 0l-2.8 2.8a4 4 0 005.7 5.7l1.4-1.4',
  smile:'M8.5 14.5s1.3 1.8 3.5 1.8 3.5-1.8 3.5-1.8M9 9.5h.01M15 9.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  flag:'M5 21V4h12l-2 4 2 4H5',
  bolt:'M13.5 3L5 13.5h6L10.5 21 19 10.5h-6z',
  shield:'M12 3l7.5 3v6c0 4.5-3.2 7.8-7.5 9-4.3-1.2-7.5-4.5-7.5-9V6z',
  arch:'M4 8h16v11.5a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 19.5zM3 4.5h18V8H3zM9.5 12h5'
};
const ui = {
  icon(name, cls, size){
    const p = P[name] || P.info;
    const s = size || 24;
    return '<svg viewBox="0 0 24 24" class="' + (cls||'ic') + '" width="'+s+'" height="'+s+'" aria-hidden="true">'
      + p.split('M').filter(Boolean).map(seg => '<path d="M'+seg+'" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>').join('')
      + '</svg>';
  },

  /* ───────── Уведомления ───────── */
  toast(title, text, kind, ms){
    const box = LP.$('#toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' toast--' + kind : '');
    const ic = kind === 'err' ? 'warn' : kind === 'warn' ? 'warn' : kind === 'ok' ? 'check' : 'info';
    el.innerHTML = '<span class="toast__ic">' + ui.icon(ic) + '</span><div><b>' + u.esc(title) + '</b>'
      + (text ? '<span>' + u.esc(text) + '</span>' : '') + '</div>';
    box.appendChild(el);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 320); }, ms || 3600);
  },

  /* ───────── Модальное окно ───────── */
  modal(opt){
    opt = opt || {};
    const root = LP.$('#modalRoot');
    const wrap = document.createElement('div');
    wrap.className = 'modal';
    wrap.innerHTML =
      '<div class="modal__box ' + (opt.wide ? 'modal--wide' : opt.slim ? 'modal--slim' : '') + '" role="dialog" aria-modal="true">'
      + '<div class="modal__head">'
        + (opt.icon ? '<div class="panel__icon">' + ui.icon(opt.icon) + '</div>' : '')
        + '<div>' + (opt.kicker ? '<span class="kicker">' + u.esc(opt.kicker) + '</span>' : '')
        + '<h3>' + u.esc(opt.title || '') + '</h3></div>'
        + '<button class="modal__x" data-close aria-label="Закрыть">' + ui.icon('x') + '</button>'
      + '</div>'
      + '<div class="modal__body">' + (opt.body || '') + '</div>'
      + (opt.foot === null ? '' : '<div class="modal__foot">' + (opt.foot != null ? opt.foot :
          '<button class="btn btn--ghost" data-close>Закрыть</button>') + '</div>')
      + '</div>';
    root.appendChild(wrap);
    root.style.pointerEvents = 'auto';
    document.body.classList.add('is-modal');

    const close = () => {
      wrap.remove();
      if (!root.children.length){ root.style.pointerEvents = 'none'; document.body.classList.remove('is-modal'); }
      document.removeEventListener('keydown', onKey);
      opt.onClose && opt.onClose();
    };
    const onKey = e => { if (e.key === 'Escape'){ e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => {
      if (e.target === wrap && opt.dismissable !== false) return close();
      if (e.target.closest('[data-close]')) close();
    });
    const h = { el: wrap, box: LP.$('.modal__box', wrap), body: LP.$('.modal__body', wrap), close };
    opt.onMount && opt.onMount(h);
    const focus = LP.$('[autofocus],input,select,textarea,button', LP.$('.modal__body', wrap));
    if (focus && !opt.noFocus) setTimeout(() => focus.focus(), 60);
    return h;
  },

  confirm(opt){
    return new Promise(res => {
      let done = false;
      const h = ui.modal({
        slim: true, title: opt.title || 'Подтвердите действие', kicker: opt.kicker || 'вопрос',
        icon: opt.danger ? 'warn' : 'info',
        body: '<p class="muted" style="font-size:14.5px">' + (opt.html || u.esc(opt.text || '')) + '</p>',
        foot: '<button class="btn btn--ghost" data-close>Отмена</button>'
            + '<button class="btn ' + (opt.danger ? 'btn--danger' : 'btn--primary') + '" data-ok>'
            + u.esc(opt.ok || 'Да, продолжить') + '</button>',
        onClose(){ if (!done) res(false); }
      });
      LP.$('[data-ok]', h.el).addEventListener('click', () => { done = true; h.close(); res(true); });
    });
  },

  drawer(opt){
    const root = LP.$('#modalRoot');
    const wrap = document.createElement('div');
    wrap.className = 'drawer';
    wrap.innerHTML = '<div class="drawer__box"><div class="drawer__head">' + (opt.head || '') + '</div>'
      + '<div class="drawer__body">' + (opt.body || '') + '</div></div>';
    root.appendChild(wrap); root.style.pointerEvents = 'auto';
    document.body.classList.add('is-modal');
    const close = () => {
      wrap.remove();
      if (!root.children.length){ root.style.pointerEvents = 'none'; document.body.classList.remove('is-modal'); }
      document.removeEventListener('keydown', onKey);
      opt.onClose && opt.onClose();
    };
    const onKey = e => { if (e.key === 'Escape'){ e.stopPropagation(); close(); } };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', e => {
      if (e.target === wrap) return close();
      if (e.target.closest('[data-close]')) close();
    });
    const h = { el: wrap, body: LP.$('.drawer__body', wrap), head: LP.$('.drawer__head', wrap), close };
    opt.onMount && opt.onMount(h);
    return h;
  },

  /* ───────── Блоки-конструкторы ───────── */
  ava(st, size){
    if (!st) return '';
    const cls = size ? ' ava--' + size : '';
    const bg = 'linear-gradient(140deg,' + st.color + ',' + shade(st.color, -28) + ')';
    return '<div class="ava' + cls + '" style="background:' + bg + ';color:' + readable(st.color) + '">'
      + (st.emoji || u.initials(st.first, st.last)) + '</div>';
  },
  stageChip(id){
    const s = C.STAGES.find(x => x.id === id) || C.STAGES[0];
    return '<span class="chip" style="color:' + s.color + ';border-color:' + s.color + '55;background:' + s.color + '1f">'
      + '<i class="chip__dot"></i>' + s.name + '</span>';
  },
  lessonChip(status){
    const s = C.LESSON[status] || C.LESSON.planned;
    return '<span class="chip' + (s.chip ? ' chip--' + s.chip : '') + '">' + s.name + '</span>';
  },
  moneyHtml(n, big){
    const cls = n > 0 ? 'money--pos' : n < 0 ? 'money--neg' : '';
    return '<span class="money ' + cls + (big ? ' money--big' : '') + '">'
      + (n > 0 ? '+' : '') + u.money(n) + '</span>';
  },
  ring(pct, size, color){
    const s = size || 54, r = (s - 7) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - u.clamp(pct, 0, 100) / 100);
    const col = color || (pct >= 80 ? 'var(--c-lime)' : pct >= 45 ? 'var(--c-cyan)' : 'var(--c-amber)');
    return '<div class="ring" style="width:' + s + 'px;height:' + s + 'px">'
      + '<svg width="' + s + '" height="' + s + '">'
      + '<circle cx="' + s/2 + '" cy="' + s/2 + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="5"/>'
      + '<circle cx="' + s/2 + '" cy="' + s/2 + '" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="5"'
      + ' stroke-linecap="round" stroke-dasharray="' + c.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"'
      + ' style="transition:stroke-dashoffset .9s cubic-bezier(.16,1,.3,1);filter:drop-shadow(0 0 5px ' + col + ')"/>'
      + '</svg><span class="ring__val" style="font-size:' + (s/4.2).toFixed(0) + 'px">' + Math.round(pct) + '%</span></div>';
  },
  bar(pct, mod){
    return '<div class="pbar' + (mod ? ' pbar--' + mod : '') + '"><div class="pbar__fill" style="width:'
      + u.clamp(pct, 0, 100) + '%"></div></div>';
  },
  empty(o){
    return '<div class="empty"><div class="empty__ic">' + ui.icon(o.icon || 'inbox') + '</div>'
      + '<h3>' + u.esc(o.title || 'Пока пусто') + '</h3>'
      + '<p>' + (o.html || u.esc(o.text || '')) + '</p>'
      + (o.action || '') + '</div>';
  },
  sectionHead(o){
    return '<div class="section-head"><div class="section-head__t">'
      + '<span class="kicker">' + u.esc(o.kicker || '') + '</span>'
      + '<h2>' + u.esc(o.title || '') + '</h2>'
      + (o.sub ? '<p>' + o.sub + '</p>' : '') + '</div>'
      + (o.actions ? '<div class="row row--wrap">' + o.actions + '</div>' : '') + '</div>';
  },
  /* подсказка, которую можно скрыть навсегда */
  hint(id, html){
    if (LP.store.db.settings.hints[id]) return '';
    return '<div class="hintbar" data-hint="' + id + '">' + ui.icon('info')
      + '<div>' + html + '</div>'
      + '<button class="hintbar__x" data-hint-close="' + id + '" title="Больше не показывать">&times;</button></div>';
  },
  kpi(o){
    return '<div class="kpi" style="--acc:' + (o.color || 'var(--c-cyan)') + '">'
      + '<div class="kpi__top"><div class="kpi__ic">' + ui.icon(o.icon || 'chart') + '</div>'
      + '<span class="kpi__label">' + u.esc(o.label) + '</span></div>'
      + '<div class="kpi__val">' + o.value + '</div>'
      + (o.sub ? '<div class="kpi__sub">' + o.sub + '</div>' : '')
      + (o.spark || '') + '</div>';
  },
  tabs(items, active){
    return '<div class="tabs" role="tablist">' + items.map(t =>
      '<button role="tab" data-tab="' + t.id + '" class="' + (t.id === active ? 'is-on' : '') + '">'
      + u.esc(t.name) + (t.n != null ? ' <span class="badge badge--soft">' + t.n + '</span>' : '') + '</button>').join('') + '</div>';
  },
  selectStudents(sel, opt){
    opt = opt || {};
    const list = LP.store.db.students.filter(s => !s.archived);
    return '<select class="select" ' + (opt.attrs || '') + '>'
      + (opt.any ? '<option value="">' + u.esc(opt.any) + '</option>' : '')
      + list.map(s => '<option value="' + s.id + '"' + (s.id === sel ? ' selected' : '') + '>'
        + u.esc((s.first + ' ' + (s.last||'')).trim()) + '</option>').join('') + '</select>';
  },
  copy(text){
    const done = () => ui.toast('Скопировано', text.length > 40 ? text.slice(0,40) + '…' : text, 'ok', 1800);
    if (navigator.clipboard) navigator.clipboard.writeText(text).then(done).catch(()=>{});
    else {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); try { document.execCommand('copy'); done(); } catch(e){} ta.remove();
    }
  },
  /* страница открыта внутри рамки (например, опубликованная версия) —
     там браузер запрещает скачивание файлов со страницы */
  framed(){
    try { return window.self !== window.top; } catch(e){ return true; }
  },

  download(name, text, type){
    if (ui.framed()) return ui.textFallback(name, text);
    try {
      const blob = new Blob([text], { type: type || 'application/json;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    } catch(e){ ui.textFallback(name, text); }
  },

  /* запасной путь: показать содержимое, чтобы скопировать и вставить в файл */
  textFallback(name, text){
    const h = ui.modal({
      wide: true, icon:'copy', kicker:'файл не скачать из этого окна',
      title:'Скопируйте содержимое',
      body:'<p class="muted" style="font-size:13.5px">Браузер не разрешает странице сохранять файлы напрямую. '
        + 'Нажмите «Скопировать всё», затем вставьте текст в любой текстовый редактор и сохраните под именем '
        + '<b>' + u.esc(name) + '</b>.</p>'
        + '<textarea class="textarea mono" id="lpDump" readonly spellcheck="false" '
        + 'style="min-height:240px;font-size:11.5px;line-height:1.45">' + u.esc(text) + '</textarea>',
      foot:'<button class="btn btn--ghost" data-close>Закрыть</button>'
         + '<button class="btn btn--primary" data-copy-all>' + ui.icon('copy') + ' Скопировать всё</button>'
    });
    h.el.addEventListener('click', e => {
      if (e.target.closest('[data-copy-all]')){
        const ta = LP.$('#lpDump', h.el);
        ta.focus(); ta.select();
        ui.copy(text);
      }
    });
    return h;
  },

  /* обратная операция: вставить текст копии и восстановить данные */
  textRestore(onText){
    const h = ui.modal({
      wide: true, icon:'upload', kicker:'из текста', title:'Восстановить из копии',
      body:'<p class="muted" style="font-size:13.5px">Вставьте сюда содержимое файла резервной копии '
        + '(его можно открыть любым текстовым редактором) и нажмите «Восстановить».</p>'
        + '<textarea class="textarea mono" id="lpPaste" spellcheck="false" placeholder=\'{ "version": 1, …\' '
        + 'style="min-height:240px;font-size:11.5px;line-height:1.45"></textarea>',
      foot:'<button class="btn btn--ghost" data-close>Отмена</button>'
         + '<button class="btn btn--primary" data-restore>' + ui.icon('check') + ' Восстановить</button>'
    });
    h.el.addEventListener('click', e => {
      if (e.target.closest('[data-restore]')){
        const val = LP.$('#lpPaste', h.el).value.trim();
        if (!val) return ui.toast('Пусто', 'Вставьте содержимое копии', 'warn');
        if (onText(val)) h.close();
      }
    });
    return h;
  }
};

/* вспомогательное: затемнение цвета и контрастный текст */
function shade(hex, pct){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#22d3ee');
  if (!m) return hex;
  const f = v => u.clamp(Math.round(parseInt(v,16) * (1 + pct/100)), 0, 255).toString(16).padStart(2,'0');
  return '#' + f(m[1]) + f(m[2]) + f(m[3]);
}
function readable(hex){
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '#22d3ee');
  if (!m) return '#05070f';
  const l = (parseInt(m[1],16)*299 + parseInt(m[2],16)*587 + parseInt(m[3],16)*114) / 1000;
  return l > 150 ? '#05070f' : '#ffffff';
}
ui.shade = shade; ui.readable = readable;
LP.ui = ui;
})();
