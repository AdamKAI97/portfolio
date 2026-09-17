/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Расписание — неделя, день, свободные окна
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;
/* на телефоне по умолчанию удобнее режим одного дня */
const state = { anchor: null, mode: (typeof window !== 'undefined' && window.innerWidth < 760) ? 'day' : 'week' };

function slots(){
  const s = S.db.settings;
  const from = d.t2m(s.dayStart || '09:00'), to = d.t2m(s.dayEnd || '19:00');
  const step = Math.max(30, s.slot || 60);
  const out = [];
  for (let m = from; m < to; m += step) out.push(m);
  return out;
}

function evHtml(l){
  const st = S.student(l.studentId);
  const col = l.status === 'missed' ? 'var(--c-red)' : l.status === 'cancelled' ? 'var(--txt-3)' : (st ? st.color : 'var(--c-cyan)');
  return '<button class="ev ev--' + l.status + '" data-lesson="' + l.id + '" style="--ec:' + col + '">'
    + '<b>' + u.esc(st ? (st.first + (st.emoji ? ' ' + st.emoji : '')) : 'удалён') + '</b>'
    + '<span>' + l.start + '–' + d.endTime(l.start, l.dur) + (l.topic ? ' · ' + u.esc(l.topic) : '') + '</span></button>';
}

function weekGrid(mon){
  const days = Array.from({ length: 7 }, (_, i) => d.add(mon, i));
  const t = d.today(), nowM = d.t2m(d.now());
  const ss = slots();
  const step = Math.max(30, S.db.settings.slot || 60);
  const workDays = S.db.settings.workDays || [0,1,2,3,4,5];

  let html = '<div class="cal"><div class="cal__grid">'
    + '<div class="cal__head"><small>время</small></div>'
    + days.map((date, i) => '<div class="cal__head' + (date === t ? ' is-today' : '') + '">'
        + '<small>' + C.WDS[i] + '</small><b>' + d.parse(date).getDate() + '</b>'
        + '<small class="dim">' + C.MONS[d.parse(date).getMonth()] + '</small></div>').join('');

  ss.forEach(m => {
    html += '<div class="cal__hour mono">' + d.m2t(m) + '</div>';
    days.forEach((date, wd) => {
      const inSlot = S.lessonsOn(date).filter(l => { const s = d.t2m(l.start); return s >= m && s < m + step; });
      const isNow = date === t && nowM >= m && nowM < m + step;
      const off = !workDays.includes(wd);
      html += '<div class="cal__cell' + (inSlot.length ? '' : ' cal__cell--free') + (off ? ' cal__cell--weekend' : '')
        + (isNow ? ' cal__cell--now' : '') + '" data-date="' + date + '" data-time="' + d.m2t(m) + '">'
        + inSlot.map(evHtml).join('') + '</div>';
    });
  });
  return html + '</div></div>';
}

function dayList(date){
  const ls = S.lessonsOn(date);
  const ss = slots(), step = Math.max(30, S.db.settings.slot || 60);
  return '<div class="panel panel--pad-0"><div class="list" style="padding:12px">'
    + ss.map(m => {
      const inSlot = ls.filter(l => { const s = d.t2m(l.start); return s >= m && s < m + step; });
      return '<div class="row" style="align-items:stretch;gap:12px">'
        + '<div class="mono dim" style="width:52px;padding-top:12px">' + d.m2t(m) + '</div>'
        + '<div class="grow">' + (inSlot.length
          ? inSlot.map(l => { const st = S.student(l.studentId);
              return '<button class="tile" data-lesson="' + l.id + '" style="width:100%">' + ui.ava(st, 'sm')
              + '<div class="grow"><div class="tile__t">' + u.esc(S.studentName(l.studentId)) + '</div>'
              + '<div class="tile__s">' + l.start + '–' + d.endTime(l.start, l.dur) + (l.topic ? ' · ' + u.esc(l.topic) : '') + '</div></div>'
              + '<span class="tile__end">' + ui.lessonChip(l.status) + '</span></button>'; }).join('')
          : '<button class="tile" data-date="' + date + '" data-time="' + d.m2t(m) + '" style="width:100%;border-style:dashed;opacity:.65">'
            + ui.icon('plus') + '<span class="tile__s">свободное окно — записать</span></button>') + '</div></div>';
    }).join('') + '</div></div>';
}

LP.views = LP.views || {};
LP.views.schedule = {
  id:'schedule', name:'Расписание', icon:'calendar', kicker:'время', title:'Расписание',

  render(){
    if (!state.anchor) state.anchor = d.today();
    const mon = d.weekStart(state.anchor);
    const week = S.lessonsBetween(mon, d.add(mon, 6));
    const live = week.filter(l => l.status !== 'cancelled');
    const hours = Math.round(u.sum(live, l => l.dur || 45) / 60 * 10) / 10;
    const money = u.sum(live, l => Number(l.price) || 0);
    const busy = u.uniq(live.map(l => l.studentId)).length;

    return ui.sectionHead({
      kicker:'время', title:'Расписание',
      sub:'Ваша неделя целиком. Нажмите на пустую клетку — запишете ребёнка на это время. Нажмите на занятие — отметите, как оно прошло.',
      actions:'<button class="btn btn--primary" data-act="new-lesson">' + ui.icon('plus') + ' Записать</button>'
    })
    + ui.hint('schedule', 'Цвет занятия — цвет ученика из его карточки. <b>Пунктир</b> — занятие уже проведено, <b>красный</b> — пропуск, <b>зачёркнутое</b> — отменено заранее.')
    + '<div class="cal__nav">'
      + '<button class="icon-btn" data-nav="-7" aria-label="Предыдущая неделя">' + ui.icon('left') + '</button>'
      + '<button class="btn btn--sm" data-nav="today">Сегодня</button>'
      + '<button class="icon-btn" data-nav="7" aria-label="Следующая неделя">' + ui.icon('right') + '</button>'
      + '<div class="cal__now">' + d.weekLabel(mon) + '<div class="kicker">' + d.parse(mon).getFullYear() + '</div></div>'
      + '<div class="row row--wrap" style="margin-left:auto;gap:8px">'
        + '<span class="chip chip--cyan">' + ui.icon('calendar') + u.nplural(live.length, ['занятие','занятия','занятий']) + '</span>'
        + '<span class="chip chip--violet">' + ui.icon('clock') + hours + ' ч</span>'
        + '<span class="chip chip--lime">' + ui.icon('wallet') + u.moneyShort(money) + '</span>'
        + '<span class="chip">' + ui.icon('users') + u.nplural(busy, ['ребёнок','ребёнка','детей']) + '</span>'
        + '<div class="seg"><button data-mode="week" class="' + (state.mode === 'week' ? 'is-on' : '') + '">Неделя</button>'
        + '<button data-mode="day" class="' + (state.mode === 'day' ? 'is-on' : '') + '">День</button></div>'
      + '</div>'
    + '</div>'
    + (state.mode === 'day'
      ? '<div class="row row--wrap" style="margin-bottom:12px">' + Array.from({ length: 7 }, (_, i) => {
          const date = d.add(mon, i);
          const n = S.lessonsOn(date).filter(l => l.status !== 'cancelled').length;
          return '<button class="picker' + (date === state.anchor ? ' is-on' : '') + '" data-day="' + date + '">'
            + C.WDS[i] + ' ' + d.parse(date).getDate() + (n ? ' <span class="badge">' + n + '</span>' : '') + '</button>';
        }).join('') + '</div>' + dayList(state.anchor)
      : weekGrid(mon))
    + '<div class="panel panel--flat" style="margin-top:16px"><div class="row row--wrap" style="gap:18px;font-size:12.5px">'
      + '<span class="dim">Условные обозначения:</span>'
      + '<span class="chip chip--blue">запланировано</span>'
      + '<span class="chip chip--lime">проведено</span>'
      + '<span class="chip chip--red">пропуск</span>'
      + '<span class="chip">отменено</span>'
      + '<span class="dim" style="margin-left:auto">Рабочие часы и дни меняются в «Настройках»</span>'
    + '</div></div>';
  },

  mount(root){
    root.addEventListener('click', e => {
      const nv = e.target.closest('[data-nav]');
      if (nv){
        state.anchor = nv.dataset.nav === 'today' ? d.today() : d.add(state.anchor, Number(nv.dataset.nav));
        return LP.app.render();
      }
      const md = e.target.closest('[data-mode]');
      if (md){ state.mode = md.dataset.mode; return LP.app.render(); }
      const dy = e.target.closest('[data-day]');
      if (dy){ state.anchor = dy.dataset.day; return LP.app.render(); }
      const ev = e.target.closest('[data-lesson]');
      if (ev) return LP.views.schedule.quick(ev.dataset.lesson);
      const cell = e.target.closest('[data-date][data-time]');
      if (cell) LP.forms.lesson({ date: cell.dataset.date, start: cell.dataset.time }, { after: () => LP.app.render() });
    });
  },

  /* быстрые действия по занятию */
  quick(id){
    const l = S.lesson(id); if (!l) return;
    const st = S.student(l.studentId);
    const bal = st ? S.balance(st.id) : 0;
    const h = ui.modal({
      slim: true, icon:'calendar', kicker: d.fmtWd(l.date) + ', ' + d.fmt(l.date),
      title: S.studentName(l.studentId),
      body: '<div class="row row--wrap" style="gap:8px;margin-bottom:14px">'
        + '<span class="chip chip--lg">' + ui.icon('clock') + l.start + '–' + d.endTime(l.start, l.dur) + '</span>'
        + ui.lessonChip(l.status)
        + '<span class="chip chip--lg">' + ui.icon('money') + u.money(l.price || 0) + '</span></div>'
        + (l.topic ? '<div class="pill-note" style="margin-bottom:10px"><b>Тема:</b> ' + u.esc(l.topic) + '</div>' : '')
        + (st ? '<div class="pill-note">Баланс ученика: ' + ui.moneyHtml(bal)
            + (bal < 0 ? ' <span class="dim">— стоит напомнить об оплате</span>' : '') + '</div>' : '')
        + '<div class="hr"></div><span class="kicker">отметить результат</span>'
        + '<div class="row row--wrap" style="margin-top:10px;gap:8px">'
          + '<button class="btn btn--good" data-set="done">' + ui.icon('check') + ' Провёл занятие</button>'
          + '<button class="btn" data-set="missed">' + ui.icon('warn') + ' Не пришёл</button>'
          + '<button class="btn" data-set="cancelled">' + ui.icon('x') + ' Отменили заранее</button>'
          + '<button class="btn" data-set="planned">' + ui.icon('refresh') + ' Вернуть в план</button>'
        + '</div>',
      foot: '<button class="btn btn--ghost left" data-open>' + ui.icon('users') + ' Карточка ученика</button>'
          + '<button class="btn" data-edit>' + ui.icon('edit') + ' Подробно</button>'
          + '<button class="btn btn--ghost" data-close>Закрыть</button>'
    });
    h.el.addEventListener('click', e => {
      const s = e.target.closest('[data-set]');
      if (s){
        S.setLessonStatus(id, s.dataset.set);
        ui.toast('Отмечено: ' + C.LESSON[s.dataset.set].name,
          s.dataset.set === 'done' ? 'Стоимость списана с баланса'
          : s.dataset.set === 'missed' && S.db.settings.chargeMissed ? 'Пропуск списан по вашим правилам'
          : 'Деньги не списаны', 'ok');
        h.close(); LP.app.render();
      }
      if (e.target.closest('[data-edit]')){ h.close(); LP.forms.lesson(id, { after: () => LP.app.render() }); }
      if (e.target.closest('[data-open]')){ h.close(); LP.views.students.card(l.studentId); }
    });
  }
};
})();
