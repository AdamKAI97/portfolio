/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · core.js — утилиты, даты, форматы, константы
   ═══════════════════════════════════════════════════════════ */
window.LP = window.LP || {};

/* ───────── Константы ───────── */
LP.C = {
  /* этапы работы с учеником — «воронка» от заявки до выпуска */
  STAGES: [
    {id:'lead',      name:'Заявка',        color:'#5b9dff', icon:'inbox',    hint:'Родитель написал или позвонил. Ещё не встречались.'},
    {id:'diagnostic',name:'Диагностика',   color:'#a855f7', icon:'search',   hint:'Назначено первичное обследование речи.'},
    {id:'trial',     name:'Пробное',       color:'#f472b6', icon:'spark',    hint:'Пробное занятие проведено или назначено.'},
    {id:'active',    name:'Занимается',    color:'#6ee7a0', icon:'play',     hint:'Постоянный ученик, ходит по расписанию.'},
    {id:'paused',    name:'Пауза',         color:'#ffc24b', icon:'pause',    hint:'Временный перерыв: болезнь, отпуск, каникулы.'},
    {id:'done',      name:'Выпустился',    color:'#22d3ee', icon:'medal',    hint:'Цель достигнута, работа завершена.'}
  ],
  LESSON: {
    planned:  {name:'Запланировано', color:'#5b9dff', chip:'blue'},
    done:     {name:'Проведено',     color:'#6ee7a0', chip:'lime'},
    missed:   {name:'Пропуск',       color:'#ff6b7a', chip:'red'},
    cancelled:{name:'Отменено',      color:'#6c78a8', chip:''}
  },
  /* этапы постановки звука — классическая логопедическая логика */
  SOUND_STAGES: [
    {n:0, name:'Не начат',          short:'—',    color:'#6c78a8', hint:'Звук выявлен как нарушенный, работа ещё не началась.'},
    {n:1, name:'Подготовка',        short:'Подг.',color:'#5b9dff', hint:'Артикуляционная гимнастика, дыхание, слуховое внимание.'},
    {n:2, name:'Постановка',        short:'Пост.',color:'#a855f7', hint:'Учимся получать правильный звук изолированно.'},
    {n:3, name:'Автоматизация',     short:'Авт.', color:'#ffc24b', hint:'Слоги → слова → фразы → стихи и рассказы.'},
    {n:4, name:'Дифференциация',    short:'Диф.', color:'#f472b6', hint:'Различаем похожие звуки: С–Ш, Р–Л, З–Ж.'},
    {n:5, name:'В свободной речи',  short:'Речь', color:'#6ee7a0', hint:'Звук закреплён, ребёнок говорит правильно сам.'}
  ],
  PAY: {
    cash:    {name:'Наличные',   icon:'cash'},
    card:    {name:'Карта',      icon:'card'},
    transfer:{name:'Перевод',    icon:'transfer'},
    other:   {name:'Другое',     icon:'wallet'}
  },
  SOURCES: ['Инстаграм','Телеграм','Рекомендация','Сайт / поиск','Детский сад','Поликлиника','Другое'],
  PALETTE: ['#22d3ee','#a855f7','#f472b6','#6ee7a0','#ffc24b','#5b9dff','#ff6b7a','#2dd4bf'],
  EMOJI: ['🦊','🐨','🐼','🦁','🐯','🐸','🐵','🐰','🦄','🐙','🦖','🐳','🦋','🌟','🚀','🎈'],
  SOUNDS: ['Р','Рь','Л','Ль','Ш','Ж','Щ','Ч','С','Сь','З','Зь','Ц','К','Г','Х','Й','Т','Д','Б','П','В','Ф','Н','М'],
  WD:  ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'],
  WDS: ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'],
  /* «в понедельник», «во вторник», «в среду» — для человеческих формулировок */
  WDA: ['в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу','в воскресенье'],
  MON: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
  MONN:['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  MONS:['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек']
};

/* ───────── Утилиты ───────── */
LP.u = {
  uid(p){ return (p||'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); },

  esc(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  },

  /* правильное русское склонение: plural(5,['занятие','занятия','занятий']) */
  plural(n, forms){
    n = Math.abs(Math.floor(n));
    const m10 = n % 10, m100 = n % 100;
    if (m10 === 1 && m100 !== 11) return forms[0];
    if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return forms[1];
    return forms[2];
  },
  nplural(n, forms){ return n + ' ' + LP.u.plural(n, forms); },

  num(n){
    const v = Math.round(Number(n) || 0);
    return String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ').replace(/^/, v < 0 ? '−' : '');
  },
  money(n, cur){
    return LP.u.num(n) + ' ' + (cur || (LP.store && LP.store.db.settings.currency) || 'сум');
  },
  moneyShort(n){
    n = Number(n) || 0;
    const a = Math.abs(n), sign = n < 0 ? '−' : '';
    if (a >= 1e9) return sign + (a/1e9).toFixed(1).replace('.0','') + ' млрд';
    if (a >= 1e6) return sign + (a/1e6).toFixed(a >= 1e7 ? 0 : 1).replace('.0','') + ' млн';
    if (a >= 1e4) return sign + Math.round(a/1e3) + ' тыс';
    return LP.u.num(n);
  },

  clamp(v, a, b){ return Math.min(b, Math.max(a, v)); },
  sum(arr, f){ return arr.reduce((s,x) => s + (f ? (Number(f(x))||0) : (Number(x)||0)), 0); },
  by(arr, key){ const m = {}; arr.forEach(x => { const k = typeof key === 'function' ? key(x) : x[key]; (m[k] = m[k] || []).push(x); }); return m; },
  sortBy(arr, f, dir){ return arr.slice().sort((a,b) => { const A=f(a), B=f(b); return (A>B?1:A<B?-1:0) * (dir === 'desc' ? -1 : 1); }); },
  uniq(a){ return Array.from(new Set(a)); },
  pick(arr, seed){ return arr[Math.abs(LP.u.hash(String(seed))) % arr.length]; },
  hash(s){ let h = 0; for (let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i)) | 0; return h; },
  debounce(fn, ms){ let t; return function(){ clearTimeout(t); const a = arguments, c = this; t = setTimeout(() => fn.apply(c,a), ms||220); }; },
  initials(first, last){
    const a = (first||'').trim()[0] || '';
    const b = (last||'').trim()[0] || '';
    return (a + b).toUpperCase() || '?';
  },
  phoneHref(p){ return 'tel:' + String(p||'').replace(/[^\d+]/g,''); },
  /* «мягкий» поиск: без регистра, по всем словам запроса */
  match(hay, q){
    const h = String(hay||'').toLowerCase();
    return String(q||'').toLowerCase().trim().split(/\s+/).filter(Boolean).every(w => h.includes(w));
  }
};

/* ───────── Работа с датами ───────── */
LP.d = {
  iso(d){
    const x = d instanceof Date ? d : new Date(d);
    return x.getFullYear() + '-' + String(x.getMonth()+1).padStart(2,'0') + '-' + String(x.getDate()).padStart(2,'0');
  },
  parse(s){
    if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate());
    const p = String(s||'').split('-').map(Number);
    return new Date(p[0], (p[1]||1)-1, p[2]||1);
  },
  today(){ const n = new Date(); return LP.d.iso(n); },
  now(){ const n = new Date(); return String(n.getHours()).padStart(2,'0') + ':' + String(n.getMinutes()).padStart(2,'0'); },
  add(s, n){ const d = LP.d.parse(s); d.setDate(d.getDate() + n); return LP.d.iso(d); },
  addMonths(s, n){ const d = LP.d.parse(s); d.setMonth(d.getMonth() + n); return LP.d.iso(d); },
  /* номер дня недели, 0 = понедельник */
  dow(s){ return (LP.d.parse(s).getDay() + 6) % 7; },
  weekStart(s){ return LP.d.add(s, -LP.d.dow(s)); },
  monthStart(s){ const d = LP.d.parse(s); return LP.d.iso(new Date(d.getFullYear(), d.getMonth(), 1)); },
  monthEnd(s){ const d = LP.d.parse(s); return LP.d.iso(new Date(d.getFullYear(), d.getMonth()+1, 0)); },
  mKey(s){ return String(s).slice(0,7); },
  diff(a, b){ return Math.round((LP.d.parse(b) - LP.d.parse(a)) / 86400000); },
  inRange(s, from, to){ return (!from || s >= from) && (!to || s <= to); },

  fmt(s){ const d = LP.d.parse(s); return d.getDate() + ' ' + LP.C.MON[d.getMonth()]; },
  fmtFull(s){ const d = LP.d.parse(s); return d.getDate() + ' ' + LP.C.MON[d.getMonth()] + ' ' + d.getFullYear(); },
  fmtShort(s){ const d = LP.d.parse(s); return String(d.getDate()).padStart(2,'0') + '.' + String(d.getMonth()+1).padStart(2,'0'); },
  fmtWd(s){ return LP.C.WD[LP.d.dow(s)]; },
  fmtMonth(s){ const d = LP.d.parse(s); return LP.C.MONN[d.getMonth()] + ' ' + d.getFullYear(); },
  /* «сегодня», «завтра», «вчера» или дата */
  human(s){
    const t = LP.d.today(), n = LP.d.diff(t, s);
    if (n === 0) return 'сегодня';
    if (n === 1) return 'завтра';
    if (n === -1) return 'вчера';
    if (n === 2) return 'послезавтра';
    if (n > 2 && n < 7) return LP.d.fmtWd(s).toLowerCase();
    return LP.d.fmt(s);
  },
  ago(s){
    const n = LP.d.diff(s, LP.d.today());
    if (n <= 0) return 'сегодня';
    if (n === 1) return 'вчера';
    if (n < 31) return n + ' ' + LP.u.plural(n, ['день','дня','дней']) + ' назад';
    const m = Math.round(n/30);
    return m + ' ' + LP.u.plural(m, ['месяц','месяца','месяцев']) + ' назад';
  },
  age(birth){
    if (!birth) return null;
    const b = LP.d.parse(birth), n = new Date();
    let a = n.getFullYear() - b.getFullYear();
    const md = n.getMonth() - b.getMonth();
    if (md < 0 || (md === 0 && n.getDate() < b.getDate())) a--;
    return a < 0 || a > 120 ? null : a;
  },
  ageText(birth){
    const a = LP.d.age(birth);
    return a == null ? '' : a + ' ' + LP.u.plural(a, ['год','года','лет']);
  },
  /* «HH:MM» → минуты и обратно */
  t2m(t){ const p = String(t||'0:0').split(':'); return (+p[0])*60 + (+p[1]||0); },
  m2t(m){ m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0'); },
  endTime(start, dur){ return LP.d.m2t(LP.d.t2m(start) + (dur||45)); },
  weekLabel(mon){
    const sun = LP.d.add(mon, 6), a = LP.d.parse(mon), b = LP.d.parse(sun);
    if (a.getMonth() === b.getMonth()) return a.getDate() + '–' + b.getDate() + ' ' + LP.C.MON[a.getMonth()];
    return a.getDate() + ' ' + LP.C.MONS[a.getMonth()] + ' – ' + b.getDate() + ' ' + LP.C.MONS[b.getMonth()];
  }
};

/* ───────── Мини-DOM ───────── */
LP.$  = (s, r) => (r||document).querySelector(s);
LP.$$ = (s, r) => Array.from((r||document).querySelectorAll(s));
