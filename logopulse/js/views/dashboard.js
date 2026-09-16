/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Пульс дня — главный экран
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store, ch = LP.chart;

function greet(){
  const h = new Date().getHours();
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
}

function todayLine(list){
  const done = list.filter(l => l.status === 'done').length;
  const left = list.filter(l => l.status === 'planned').length;
  if (!list.length) return 'На сегодня занятий нет. Хороший день, чтобы разобрать заявки или подготовить материалы.';
  if (!left) return 'Все занятия на сегодня закрыты. Проведено: ' + done + '. Можно выдохнуть.';
  return 'Сегодня ' + u.nplural(list.length, ['занятие','занятия','занятий'])
    + (done ? ', из них проведено ' + done : '') + '. Впереди ещё ' + u.nplural(left, ['занятие','занятия','занятий']) + '.';
}

function timeline(list){
  if (!list.length) return ui.empty({
    icon:'calendar', title:'На сегодня пусто',
    text:'Запишите ученика — он появится здесь с кнопками «провести» и «пропуск».',
    action:'<button class="btn btn--primary btn--sm" data-act="new-lesson">' + ui.icon('plus') + ' Записать на занятие</button>'
  });
  const nowM = d.t2m(d.now());
  return '<div class="timeline">' + list.map(l => {
    const st = S.student(l.studentId);
    const from = d.t2m(l.start), to = from + (l.dur || 45);
    const isNow = l.status === 'planned' && nowM >= from && nowM < to;
    return '<div class="tl-row tl-row--' + l.status + (isNow ? ' tl-row--now' : '') + '">'
      + '<div class="tl-row__time mono">' + l.start + '</div>'
      + '<div class="tl-row__dot"></div>'
      + '<div class="tl-row__card">'
        + ui.ava(st, 'sm')
        + '<div class="grow" style="min-width:0">'
          + '<div class="tile__t trunc">' + u.esc(st ? S.studentName(st.id) : 'Ученик удалён') + '</div>'
          + '<div class="tile__s trunc">' + (l.topic ? u.esc(l.topic) : '<span class="dim">тема не записана</span>')
          + ' · ' + l.dur + ' мин</div>'
        + '</div>'
        + (isNow ? '<span class="chip chip--cyan"><i class="chip__dot"></i>идёт сейчас</span>' : '')
        + (l.status !== 'planned' ? ui.lessonChip(l.status) : '')
        + '<div class="tl-actions">'
          + (l.status === 'planned'
            ? '<button class="btn btn--xs btn--good" data-act="done" data-id="' + l.id + '" data-tip="Занятие состоялось">' + ui.icon('check') + ' Провести</button>'
              + '<button class="btn btn--xs" data-act="missed" data-id="' + l.id + '" data-tip="Не пришёл без предупреждения">Пропуск</button>'
              + '<button class="btn btn--xs" data-act="cancel" data-id="' + l.id + '" data-tip="Отменили заранее — не списываем деньги">Отмена</button>'
            : '<button class="btn btn--xs" data-act="edit" data-id="' + l.id + '">' + ui.icon('edit') + '</button>')
          + '<button class="btn btn--xs" data-act="open" data-id="' + (st ? st.id : '') + '" data-tip="Открыть карточку">' + ui.icon('right') + '</button>'
        + '</div>'
      + '</div></div>';
  }).join('') + '</div>';
}

function alertsPanel(){
  const list = S.alerts();
  const tone = { red:'chip--red', amber:'chip--amber', violet:'chip--violet', pink:'chip--pink', blue:'chip--blue' };
  return '<div class="panel panel--accent-amber panel--hud">'
    + '<div class="panel__head"><div class="panel__icon">' + ui.icon('bell') + '</div>'
    + '<div><span class="kicker">не потерять</span><h3>Требует внимания</h3></div>'
    + '<span class="badge' + (list.length ? '' : ' badge--soft') + '">' + list.length + '</span></div>'
    + (list.length
      ? '<div class="list">' + list.slice(0, 8).map(a =>
          '<button class="tile" data-act="open" data-id="' + a.studentId + '">'
          + '<span class="chip ' + (tone[a.tone]||'') + '" style="flex:none">' + u.esc(a.text) + '</span>'
          + '<span class="grow trunc" style="font-size:13px">' + u.esc(a.sub) + '</span>'
          + '<span class="tile__end dim">' + ui.icon('right') + '</span></button>').join('')
        + (list.length > 8 ? '<div class="center dim" style="font-size:12px;padding-top:6px">и ещё ' + (list.length - 8) + '</div>' : '')
        + '</div>'
      : ui.empty({ icon:'shield', title:'Всё под контролем', text:'Долгов нет, заявки разобраны, занятия отмечены.' }))
    + '</div>';
}

function tasksPanel(){
  const list = u.sortBy(S.db.tasks.filter(t => !t.done), t => t.date).slice(0, 7);
  const doneN = S.db.tasks.filter(t => t.done).length;
  return '<div class="panel panel--accent-violet">'
    + '<div class="panel__head"><div class="panel__icon">' + ui.icon('flag') + '</div>'
    + '<div><span class="kicker">мои дела</span><h3>Задачи</h3></div>'
    + '<button class="btn btn--xs" data-act="new-task">' + ui.icon('plus') + ' Добавить</button></div>'
    + (list.length ? '<div class="list">' + list.map(t =>
        '<div class="tile" style="cursor:default">'
        + '<label class="switch" style="padding:0"><input type="checkbox" data-act="task" data-id="' + t.id + '"><span class="switch__track"></span></label>'
        + '<div class="grow"><div class="tile__t" style="font-size:13.5px">' + u.esc(t.title) + '</div>'
        + '<div class="tile__s">' + (t.date < d.today() ? '<span style="color:var(--c-red)">просрочено · ' + d.fmtShort(t.date) + '</span>' : d.human(t.date))
        + (t.studentId ? ' · ' + u.esc(S.studentName(t.studentId)) : '') + '</div></div>'
        + '<button class="kmini" data-act="task-del" data-id="' + t.id + '" title="Удалить">' + ui.icon('x') + '</button>'
        + '</div>').join('') + '</div>'
      : '<p class="dim" style="font-size:13px;margin:0">Задач нет. Добавьте, чтобы не держать в голове.</p>')
    + (doneN ? '<div class="hr"></div><div class="dim" style="font-size:12px">Выполнено за всё время: ' + doneN + '</div>' : '')
    + '</div>';
}

LP.views = LP.views || {};
LP.views.dashboard = {
  id:'dashboard', name:'Пульс дня', icon:'pulse', kicker:'обзор', title:'Пульс дня',

  render(){
    const t = d.today();
    const today = S.lessonsOn(t);
    const mm = S.monthMoney();
    const months = S.byMonth(6);
    const act = S.activeStudents();
    const debt = S.debtors();
    const debtSum = u.sum(debt, x => -x.balance);
    const week = S.lessonsBetween(t, d.add(t, 6)).filter(l => l.status === 'planned');
    const tr = S.monthTrend();
    const diff = tr.pct;

    return ''
    /* ── приветствие ── */
    + '<div class="hero"><div class="hero__in">'
      + '<div class="grow">'
        + '<span class="kicker">' + d.fmtWd(t) + ', ' + d.fmtFull(t) + '</span>'
        + '<h2>' + greet() + ', ' + u.esc((S.db.settings.therapist || '').split(' ')[0] || 'коллега') + '!</h2>'
        + '<p>' + todayLine(today) + '</p>'
      + '</div>'
      + '<div class="hero__clock"><b id="heroClock" class="mono">' + d.now() + '</b>'
        + '<span>' + u.esc(S.db.settings.clinic || '') + '</span>'
        + '<div class="hero__pulse">' + [.5,.8,.35,1,.6,.9,.45].map((v,i) =>
            '<i style="height:' + (v*100) + '%;animation-delay:' + (i*.11).toFixed(2) + 's"></i>').join('') + '</div>'
      + '</div>'
    + '</div></div>'

    /* ── ключевые цифры ── */
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'calendar', color:'var(--c-cyan)', label:'Занятий сегодня',
          value: today.length + '',
          sub: (today.length ? 'проведено ' + today.filter(l => l.status === 'done').length + ' из ' + today.length + ' · ' : '')
             + (week.length ? 'на неделе ещё ' + week.length : 'на неделе больше ничего нет') })
      + ui.kpi({ icon:'wallet', color:'var(--c-lime)', label:'Получено за месяц',
          value: u.moneyShort(mm.paid) + ' <small>' + S.db.settings.currency + '</small>',
          sub: (diff == null ? 'Первый месяц учёта'
              : '<span class="trend trend--' + (diff > 0 ? 'up' : diff < 0 ? 'down' : 'flat') + '">'
                + (diff > 0 ? '▲' : diff < 0 ? '▼' : '■') + ' ' + Math.abs(diff) + '%</span> '
                + 'к прошлому месяцу на ту же дату'),
          spark: ch.spark(months.map(m => m.paid), { color:'#6ee7a0' }) })
      + ui.kpi({ icon:'users', color:'var(--c-violet)', label:'Учеников в работе',
          value: act.length + '',
          sub: 'Всего карточек: ' + S.db.students.length + ' · заявок: ' + S.db.students.filter(s => s.stage === 'lead').length })
      + ui.kpi({ icon:'warn', color: debtSum ? 'var(--c-red)' : 'var(--c-lime)', label:'Долги родителей',
          value: debtSum ? u.moneyShort(debtSum) + ' <small>' + S.db.settings.currency + '</small>' : 'нет',
          sub: debtSum ? u.nplural(debt.length, ['человек должен','человека должны','человек должны']) : 'Все занятия оплачены' })
    + '</div>'

    /* ── основное ── */
    + '<div class="grid grid--main">'
      + '<div class="stack">'
        + '<div class="panel panel--accent-cyan panel--hud">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('clock') + '</div>'
          + '<div><span class="kicker">' + d.fmtWd(t).toLowerCase() + '</span><h3>Расписание на сегодня</h3></div>'
          + '<div class="row"><button class="btn btn--sm" data-act="new-lesson">' + ui.icon('plus') + ' Записать</button></div></div>'
          + timeline(today)
        + '</div>'
        + '<div class="panel panel--accent-lime">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('chart') + '</div>'
          + '<div><span class="kicker">полгода</span><h3>Деньги по месяцам</h3></div>'
          + '<a class="btn btn--xs" href="#/finance">Подробнее ' + ui.icon('right') + '</a></div>'
          + ch.grouped(months.map(m => ({ label:m.label, full:m.full, a:m.paid, b:m.earned })),
              { money:true, na:'Получено', nb:'Начислено', height:230, aria:'Доход по месяцам' })
          + '<div class="chart-legend">'
            + '<span><i style="background:linear-gradient(135deg,#22d3ee,#6f7bff)"></i>Получено деньгами</span>'
            + '<span><i style="background:linear-gradient(135deg,#ffc24b,#f472b6)"></i>Начислено за занятия</span>'
            + '<span class="dim">Если оранжевый выше — растёт долг</span>'
          + '</div>'
        + '</div>'
      + '</div>'
      + '<div class="stack">' + alertsPanel() + tasksPanel() + nextDays() + '</div>'
    + '</div>';
  },

  mount(root){
    const clock = LP.$('#heroClock', root);
    if (clock) LP.app.tick = setInterval(() => { clock.textContent = d.now(); }, 20000);

    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'done'){ S.setLessonStatus(id, 'done'); ui.toast('Занятие проведено', 'Списано с баланса ученика', 'ok'); }
      if (act === 'missed'){ S.setLessonStatus(id, 'missed'); ui.toast('Отмечен пропуск',
        S.db.settings.chargeMissed ? 'Занятие списано (так настроено)' : 'Деньги не списаны', 'warn'); }
      if (act === 'cancel'){ S.setLessonStatus(id, 'cancelled'); ui.toast('Занятие отменено', 'Деньги не списываются', ''); }
      if (act === 'edit') LP.forms.lesson(id, { after: () => LP.app.render() });
      if (act === 'open' && id) LP.views.students.card(id);
      if (act === 'new-lesson') LP.forms.lesson({}, { after: () => LP.app.render() });
      if (act === 'new-task') LP.forms.task({ after: () => LP.app.render() });
      if (act === 'task'){ S.toggleTask(id); ui.toast('Задача выполнена', '', 'ok', 1600); }
      if (act === 'task-del') S.delTask(id);
    });
  }
};

/* ближайшие дни */
function nextDays(){
  const t = d.today();
  const days = [];
  for (let i = 1; i <= 4; i++){
    const date = d.add(t, i);
    const ls = S.lessonsOn(date).filter(l => l.status !== 'cancelled');
    days.push({ date, ls });
  }
  return '<div class="panel panel--accent-pink">'
    + '<div class="panel__head"><div class="panel__icon">' + ui.icon('right') + '</div>'
    + '<div><span class="kicker">что дальше</span><h3>Ближайшие дни</h3></div></div>'
    + '<div class="list">' + days.map(x =>
      '<a class="tile" href="#/schedule">'
      + '<div class="ava ava--sm" style="background:var(--panel-3);color:var(--txt-2);box-shadow:none">'
        + '<span style="font-size:11px;font-weight:800">' + C.WDS[d.dow(x.date)] + '</span></div>'
      + '<div class="grow"><div class="tile__t" style="font-size:13.5px">' + d.human(x.date) + ', ' + d.fmt(x.date) + '</div>'
      + '<div class="tile__s">' + (x.ls.length
          ? x.ls.slice(0,3).map(l => l.start).join(', ') + (x.ls.length > 3 ? ' и ещё ' + (x.ls.length-3) : '')
          : '<span class="dim">свободный день</span>') + '</div></div>'
      + '<span class="tile__end"><span class="badge' + (x.ls.length ? '' : ' badge--soft') + '">' + x.ls.length + '</span></span></a>').join('')
    + '</div></div>';
}
})();
