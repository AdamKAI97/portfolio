/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · app.js — навигация, поиск, обучение, запуск
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;

const NAV = [
  { group:'Каждый день', items:['dashboard','schedule','journal'] },
  { group:'Дети',        items:['students','pipeline','progress'] },
  { group:'Итоги',       items:['finance','reports'] },
  { group:'',            items:['settings'] }
];

const app = {
  cur: 'dashboard',
  tick: null,

  /* ───── навигация ───── */
  buildNav(){
    const nav = LP.$('#nav');
    nav.innerHTML = NAV.map(g =>
      (g.group ? '<div class="nav__group">' + g.group + '</div>' : '')
      + g.items.map(id => {
        const v = LP.views[id]; if (!v) return '';
        return '<a class="nav__item" href="#/' + id + '" data-nav="' + id + '" title="' + u.esc(v.name) + '">'
          + ui.icon(v.icon) + '<span class="nav__label">' + u.esc(v.name) + '</span>'
          + '<span class="badge" data-badge="' + id + '" hidden></span></a>';
      }).join('')).join('');
  },

  badges(){
    const n = {
      pipeline: S.db.students.filter(s => !s.archived && s.stage === 'lead').length,
      journal:  S.db.lessons.filter(l => l.status === 'planned' && l.date < d.today()).length,
      finance:  S.debtors().length,
      dashboard: S.lessonsOn(d.today()).filter(l => l.status === 'planned').length
    };
    LP.$$('[data-badge]').forEach(b => {
      const v = n[b.dataset.badge] || 0;
      b.textContent = v; b.hidden = !v;
    });
    const alerts = S.alerts().length;
    const dot = LP.$('#bellDot'); if (dot) dot.hidden = !alerts;
    const stat = LP.$('#sideStat');
    if (stat){
      const today = S.lessonsOn(d.today()).filter(l => l.status !== 'cancelled');
      const mm = S.monthMoney();
      stat.innerHTML = '<small>сегодня</small><b>' + u.nplural(today.length, ['занятие','занятия','занятий']) + '</b>'
        + '<div class="hr" style="margin:6px 0"></div>'
        + '<small>получено за месяц</small><b class="mono" style="font-size:16px">' + u.moneyShort(mm.paid) + ' ' + S.db.settings.currency + '</b>';
    }
  },

  /* ───── отрисовка раздела ───── */
  render(){
    const v = LP.views[app.cur] || LP.views.dashboard;
    clearInterval(app.tick); app.tick = null;

    const host = document.createElement('section');
    host.className = 'view__in';
    host.innerHTML = v.render();
    const root = LP.$('#view');
    root.replaceChildren(host);
    v.mount && v.mount(host);

    LP.$('#topTitle').textContent = v.title;
    LP.$('#topKicker').textContent = v.kicker;
    document.title = v.title + ' · ЛогоПульс';
    LP.$$('[data-nav]').forEach(a => a.classList.toggle('is-active', a.dataset.nav === app.cur));
    app.badges();
    LP.$('#footStamp').textContent = 'обновлено ' + d.now();
  },

  go(id){
    if (!LP.views[id]) id = 'dashboard';
    app.cur = id;
    if (location.hash !== '#/' + id) location.hash = '#/' + id;
    else app.render();
    LP.$('#sidebar').classList.remove('is-open');
    LP.$('#scrim').hidden = true;
  },

  /* ───── тема ───── */
  theme(next){
    const t = next || (document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', t);
    S.db.settings.theme = t;
    S.save();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? '#05060e' : '#eef1fb');
  },

  /* ───── глобальный поиск ───── */
  search(q){
    const box = LP.$('#searchResults');
    const res = S.searchAll(q);
    if (!q || !q.trim()){ box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = res.length
      ? res.map(r => '<button class="search__row" data-go="' + r.id + '">'
          + '<span class="ava ava--xs" style="background:' + r.color + ';color:' + ui.readable(r.color) + '">' + (r.emoji||'') + '</span>'
          + '<span>' + u.esc(r.title) + '</span><small>' + u.esc(r.sub) + '</small></button>').join('')
      : '<div class="dim center" style="padding:16px;font-size:13px">Ничего не нашлось. Попробуйте имя ребёнка или телефон.</div>';
  },

  /* ───── окно «требует внимания» ───── */
  alertsModal(){
    const list = S.alerts();
    ui.modal({
      icon:'bell', kicker:'сводка', title:'Требует внимания',
      body: list.length
        ? '<div class="list">' + list.map(a => '<button class="tile" data-sid="' + a.studentId + '">'
            + '<span class="chip chip--' + (a.tone === 'red' ? 'red' : a.tone === 'amber' ? 'amber' : a.tone === 'pink' ? 'pink' : 'violet')
            + '" style="flex:none">' + u.esc(a.text) + '</span>'
            + '<span class="grow trunc">' + u.esc(a.sub) + '</span>'
            + '<span class="tile__end dim">' + ui.icon('right') + '</span></button>').join('') + '</div>'
        : ui.empty({ icon:'shield', title:'Всё спокойно', text:'Долгов нет, заявки разобраны, занятия отмечены.' }),
      foot:'<button class="btn btn--ghost" data-close>Закрыть</button>',
      onMount(h){
        h.el.addEventListener('click', e => {
          const b = e.target.closest('[data-sid]');
          if (b && b.dataset.sid){ h.close(); LP.views.students.card(b.dataset.sid); }
        });
      }
    });
  },

  /* ───── помощь ───── */
  help(){
    const steps = [
      ['Заявка', 'Родитель написал — заведите карточку в разделе «Воронка приёма». Ребёнок появится в столбце «Заявка».'],
      ['Диагностика и пробное', 'Перетащите карточку вправо по мере продвижения. Так вы видите, кто застрял без ответа.'],
      ['Расписание', 'Нажмите на пустую клетку в «Расписании» — запишете ребёнка. Можно сразу создать повтор на 4 недели вперёд.'],
      ['Занятие прошло', 'Отметьте «Провёл» — стоимость спишется с баланса, занятие попадёт в журнал и в отчёты.'],
      ['Звуки', 'В карточке ребёнка, вкладка «Речь»: двигайте звук по этапам. Родителю можно распечатать отчёт о динамике.'],
      ['Деньги', 'Записывайте оплаты в «Финансах». Красный баланс — долг, зелёный — оплачено вперёд. Напоминание копируется одной кнопкой.'],
      ['Резервная копия', 'Раз в неделю: «Настройки» → «Скачать резервную копию». Данные живут в вашем браузере, не в интернете.']
    ];
    ui.modal({
      wide:true, icon:'info', kicker:'как это работает', title:'Помощь и обучение',
      body: '<p class="muted">ЛогоПульс ведёт ребёнка от первого сообщения родителя до оплаченного результата. Семь шагов — весь цикл:</p>'
        + steps.map((s, i) => '<div class="tour-step"><div class="tour-step__n">' + (i+1) + '</div>'
          + '<div><b>' + s[0] + '</b><p>' + s[1] + '</p></div></div>').join('')
        + '<div class="hr"></div><span class="kicker">горячие клавиши</span>'
        + '<div class="row row--wrap" style="margin-top:10px;gap:10px">'
        + [['/','поиск'],['N','создать'],['1…8','разделы'],['Esc','закрыть окно']].map(k =>
          '<span class="chip chip--lg"><kbd class="mono">' + k[0] + '</kbd> ' + k[1] + '</span>').join('')
        + '</div>'
        + '<div class="hintbar" style="margin-top:16px">' + ui.icon('shield')
        + '<div><b>Где живут данные.</b> Всё хранится только в этом браузере на этом устройстве. '
        + 'Никакой регистрации и передачи в интернет. Чтобы перенести на другой компьютер — сделайте резервную копию и восстановите её там.</div></div>',
      foot:'<button class="btn btn--ghost" data-close>Понятно</button>'
         + '<button class="btn btn--primary" data-close data-go-settings>Открыть настройки</button>',
      onMount(h){
        h.el.addEventListener('click', e => { if (e.target.closest('[data-go-settings]')) app.go('settings'); });
      }
    });
  },

  /* ───── первый запуск ───── */
  welcome(){
    ui.modal({
      dismissable:false, icon:'spark', kicker:'добро пожаловать', title:'ЛогоПульс — ваш кабинет',
      body:'<p class="muted" style="font-size:14.5px">Платформа ведёт всю вашу работу: от заявки родителя до оплаченного занятия '
        + 'и поставленного звука. Всё в одном месте, без таблиц и блокнотов.</p>'
        + '<div class="grid grid--2" style="margin-top:14px">'
        + [['calendar','Расписание и журнал','Неделя перед глазами, отметка занятия в один клик'],
           ['kanban','Воронка приёма','Видно, кто из родителей ждёт ответа'],
           ['wave','Прогресс речи','Каждый звук по этапам — и отчёт родителю'],
           ['wallet','Деньги','Баланс, долги, напоминания и графики']].map(x =>
          '<div class="panel panel--flat"><div class="row"><div class="panel__icon">' + ui.icon(x[0]) + '</div>'
          + '<div><b>' + x[1] + '</b><div class="dim" style="font-size:12.5px">' + x[2] + '</div></div></div></div>').join('')
        + '</div>'
        + '<div class="hintbar" style="margin-top:16px">' + ui.icon('info')
        + '<div>С чего начать? Если хотите сначала посмотреть, как всё выглядит на живых данных — загрузите демо-кабинет с вымышленными детьми. Его можно стереть в любой момент.</div></div>',
      foot:'<button class="btn btn--ghost" data-start-empty>Начать с чистого кабинета</button>'
         + '<button class="btn btn--primary" data-start-demo>' + ui.icon('spark') + ' Показать на примере</button>',
      onMount(h){
        h.el.addEventListener('click', e => {
          if (e.target.closest('[data-start-demo]')){
            S.reset(true);
            S.db.settings.onboarded = true; S.save();
            h.close(); app.render();
            ui.toast('Демо-кабинет загружен', 'Это выдуманные дети — пробуйте всё смело', 'ok', 5000);
          }
          if (e.target.closest('[data-start-empty]')){
            S.db.settings.onboarded = true; S.save();
            h.close(); app.render();
            ui.toast('Кабинет готов', 'Начните с кнопки «Создать» наверху', 'ok', 4500);
          }
        });
      }
    });
  },

  /* ───── запуск ───── */
  start(){
    const had = S.load();
    if (!had) S.db.settings.onboarded = false;
    app.theme(S.db.settings.theme === 'light' ? 'light' : 'dark');
    app.buildNav();

    const hash = (location.hash || '').replace('#/', '');
    app.cur = LP.views[hash] ? hash : 'dashboard';
    app.render();

    LP.$('#boot').classList.add('is-done');
    LP.$('#app').hidden = false;
    setTimeout(() => { const b = LP.$('#boot'); if (b) b.remove(); }, 700);

    if (!S.db.settings.onboarded) setTimeout(app.welcome, 500);

    /* данные изменились — обновим бейджи (перерисовку вызывают сами разделы) */
    S.on(() => app.badges());

    /* маршрутизация */
    window.addEventListener('hashchange', () => {
      const id = (location.hash || '').replace('#/', '');
      app.cur = LP.views[id] ? id : 'dashboard';
      app.render();
      LP.$('#view').focus({ preventScroll:true });
    });

    /* общие обработчики */
    document.addEventListener('click', e => {
      if (e.target.closest('[data-open-help]')) return app.help();
      if (e.target.closest('[data-open-settings]')) return app.go('settings');
      const hx = e.target.closest('[data-hint-close]');
      if (hx){
        S.db.settings.hints[hx.dataset.hintClose] = true; S.save();
        const bar = hx.closest('.hintbar'); if (bar) bar.remove();
      }
      const sr = e.target.closest('[data-go]');
      if (sr){
        LP.$('#searchResults').hidden = true;
        LP.$('#globalSearch').value = '';
        LP.$('#searchBox').classList.remove('is-open');
        LP.views.students.card(sr.dataset.go);
      }
      if (!e.target.closest('#searchBox')) LP.$('#searchResults').hidden = true;
    });

    LP.$('#searchBtn').addEventListener('click', () => {
      const box = LP.$('#searchBox');
      const open = box.classList.toggle('is-open');
      if (open) si.focus(); else LP.$('#searchResults').hidden = true;
    });
    LP.$('#themeToggle').addEventListener('click', () => app.theme());
    LP.$('#bellBtn').addEventListener('click', app.alertsModal);
    LP.$('#quickAdd').addEventListener('click', () => LP.forms.quick());
    LP.$('#sidebarCollapse').addEventListener('click', () => {
      LP.$('#app').classList.toggle('is-collapsed');
    });
    LP.$('#burger').addEventListener('click', () => {
      const s = LP.$('#sidebar'), open = s.classList.toggle('is-open');
      LP.$('#scrim').hidden = !open;
      LP.$('#searchBox').classList.remove('is-open');
    });
    LP.$('#scrim').addEventListener('click', () => {
      LP.$('#sidebar').classList.remove('is-open');
      LP.$('#scrim').hidden = true;
    });

    const si = LP.$('#globalSearch');
    si.addEventListener('input', u.debounce(() => app.search(si.value), 160));
    si.addEventListener('focus', () => { if (si.value) app.search(si.value); });
    si.addEventListener('keydown', e => {
      if (e.key === 'Escape'){
        si.value = ''; si.blur();
        LP.$('#searchResults').hidden = true;
        LP.$('#searchBox').classList.remove('is-open');
      }
      if (e.key === 'Enter'){
        const first = LP.$('#searchResults .search__row');
        if (first) first.click();
      }
    });

    /* горячие клавиши */
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||'')) || e.target.isContentEditable;
      if (typing) return;
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')){
        e.preventDefault();
        LP.$('#searchBox').classList.add('is-open');
        si.focus();
      }
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !LP.$('#modalRoot').children.length){
        e.preventDefault(); LP.forms.quick();
      }
      const order = NAV.flatMap(g => g.items);
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= order.length && !e.ctrlKey && !e.metaKey) app.go(order[n - 1]);
    });

    /* ничего не теряем при закрытии вкладки */
    window.addEventListener('beforeunload', () => S.flush());
    document.addEventListener('visibilitychange', () => { if (document.hidden) S.flush(); });

    /* обновление часов и бейджей раз в минуту */
    setInterval(() => app.badges(), 60000);
    console.log('%cЛогоПульс','background:linear-gradient(135deg,#22d3ee,#a855f7);color:#05070f;padding:4px 12px;border-radius:8px;font-weight:800');
  }
};

LP.app = app;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', app.start);
else app.start();
})();
