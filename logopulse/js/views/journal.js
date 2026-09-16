/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Журнал занятий — история и отметки
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;
const state = { period:'month', student:'', status:'', q:'', from:'', to:'' };

function range(){
  const t = d.today();
  if (state.period === 'week')  return [d.weekStart(t), d.add(d.weekStart(t), 6)];
  if (state.period === 'month') return [d.monthStart(t), d.monthEnd(t)];
  if (state.period === 'prev'){ const p = d.addMonths(t, -1); return [d.monthStart(p), d.monthEnd(p)]; }
  if (state.period === 'custom') return [state.from || '0000-01-01', state.to || '9999-12-31'];
  return ['0000-01-01', '9999-12-31'];
}

function filtered(){
  const [from, to] = range();
  return u.sortBy(S.db.lessons.filter(l =>
    l.date >= from && l.date <= to
    && (!state.student || l.studentId === state.student)
    && (!state.status || l.status === state.status)
    && (!state.q || u.match([S.studentName(l.studentId), l.topic, l.notes, l.homework].join(' '), state.q))
  ), l => l.date + l.start, 'desc');
}

function pending(){
  return u.sortBy(S.db.lessons.filter(l => l.status === 'planned' && l.date < d.today()), l => l.date);
}

LP.views = LP.views || {};
LP.views.journal = {
  id:'journal', name:'Журнал занятий', icon:'book', kicker:'история', title:'Журнал занятий',

  render(){
    const arr = filtered();
    const pend = pending();
    const done = arr.filter(l => l.status === 'done');
    const missed = arr.filter(l => l.status === 'missed');
    const cancelled = arr.filter(l => l.status === 'cancelled');
    const earned = u.sum(arr, S.charge);
    const att = (done.length + missed.length) ? Math.round(done.length / (done.length + missed.length) * 100) : null;

    return ui.sectionHead({
      kicker:'история', title:'Журнал занятий',
      sub:'Все занятия за выбранный период: что провели, кто не пришёл, какое домашнее задание выдали.',
      actions:'<button class="btn" data-act="export">' + ui.icon('download') + ' Выгрузить в CSV</button>'
        + '<button class="btn btn--primary" data-act="new-lesson">' + ui.icon('plus') + ' Записать</button>'
    })
    + (pend.length
      ? '<div class="panel panel--accent-amber panel--glowline" style="margin-bottom:18px">'
        + '<div class="panel__head"><div class="panel__icon">' + ui.icon('warn') + '</div>'
        + '<div><span class="kicker">не отмечено</span><h3>Прошедшие занятия без результата</h3></div>'
        + '<div class="row"><button class="btn btn--sm btn--good" data-act="mark-all">'
          + ui.icon('check') + ' Отметить все как проведённые</button></div></div>'
        + '<p class="muted" style="font-size:13px">Пока занятие не отмечено, оно не попадает в деньги и в посещаемость.</p>'
        + '<div class="list">' + pend.slice(0, 6).map(l =>
          '<div class="tile" style="cursor:default">' + ui.ava(S.student(l.studentId), 'xs')
          + '<div class="grow"><div class="tile__t" style="font-size:13.5px">' + u.esc(S.studentName(l.studentId)) + '</div>'
          + '<div class="tile__s">' + d.fmtFull(l.date) + ', ' + l.start + '</div></div>'
          + '<div class="row" style="gap:6px">'
            + '<button class="btn btn--xs btn--good" data-act="done" data-id="' + l.id + '">Провёл</button>'
            + '<button class="btn btn--xs" data-act="missed" data-id="' + l.id + '">Пропуск</button>'
            + '<button class="btn btn--xs" data-act="cancel" data-id="' + l.id + '">Отмена</button>'
          + '</div></div>').join('')
        + (pend.length > 6 ? '<div class="dim center" style="font-size:12px">…и ещё ' + (pend.length - 6) + '</div>' : '')
        + '</div></div>'
      : '')
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'check', color:'var(--c-lime)', label:'Проведено', value: done.length + '',
          sub: Math.round(u.sum(done, l => l.dur||45) / 60) + ' часов работы' })
      + ui.kpi({ icon:'warn', color:'var(--c-red)', label:'Пропусков', value: missed.length + '',
          sub: cancelled.length + ' отменено заранее' })
      + ui.kpi({ icon:'target', color:'var(--c-cyan)', label:'Посещаемость',
          value:(att == null ? '—' : att + '%'), sub:'доля состоявшихся занятий' })
      + ui.kpi({ icon:'money', color:'var(--c-violet)', label:'Начислено за период',
          value: u.moneyShort(earned) + ' <small>' + S.db.settings.currency + '</small>', sub:'по проведённым занятиям' })
    + '</div>'
    + '<div class="filters">'
      + '<select class="select" data-f="period">'
        + [['week','Эта неделя'],['month','Этот месяц'],['prev','Прошлый месяц'],['all','За всё время'],['custom','Свой период']]
          .map(o => '<option value="' + o[0] + '"' + (state.period === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
      + (state.period === 'custom'
          ? '<input class="input" type="date" data-f="from" value="' + state.from + '">'
            + '<input class="input" type="date" data-f="to" value="' + state.to + '">' : '')
      + ui.selectStudents(state.student, { attrs:'data-f="student"', any:'Все ученики' })
      + '<select class="select" data-f="status"><option value="">Любой статус</option>'
        + Object.keys(C.LESSON).map(k => '<option value="' + k + '"' + (state.status === k ? ' selected' : '') + '>'
          + C.LESSON[k].name + '</option>').join('') + '</select>'
      + '<input class="input" data-f="q" value="' + u.esc(state.q) + '" placeholder="Поиск по теме или заметке">'
    + '</div>'
    + (arr.length
      ? '<div class="panel panel--pad-0"><div class="table-wrap" style="--tmax:62vh"><table class="table"><thead><tr>'
        + '<th>Дата</th><th>Ученик</th><th>Тема · что делали</th><th>Домашнее</th><th>Статус</th><th class="right">Сумма</th><th></th>'
        + '</tr></thead><tbody>'
        + arr.map(l => '<tr>'
          + '<td class="nowrap"><b>' + d.fmtShort(l.date) + '</b><div class="dim mono" style="font-size:11px">' + l.start + '</div></td>'
          + '<td><div class="row" style="gap:8px">' + ui.ava(S.student(l.studentId), 'xs')
            + '<span class="trunc" style="max-width:130px">' + u.esc(S.studentName(l.studentId)) + '</span></div></td>'
          + '<td><div style="font-weight:600">' + u.esc(l.topic || '—') + '</div>'
            + (l.notes ? '<div class="dim" style="font-size:12px">' + u.esc(l.notes) + '</div>' : '') + '</td>'
          + '<td class="muted" style="font-size:12.5px;max-width:200px">' + u.esc(l.homework || '—') + '</td>'
          + '<td>' + ui.lessonChip(l.status) + '</td>'
          + '<td class="right mono">' + (S.charge(l) ? u.moneyShort(S.charge(l)) : '—') + '</td>'
          + '<td class="right"><button class="kmini" data-act="edit" data-id="' + l.id + '">' + ui.icon('edit') + '</button></td>'
          + '</tr>').join('')
        + '</tbody></table></div></div>'
      : ui.empty({ icon:'book', title:'За этот период занятий нет',
          text:'Измените период сверху или запишите новое занятие.',
          action:'<button class="btn btn--primary btn--sm" data-act="new-lesson">' + ui.icon('plus') + ' Записать занятие</button>' }));
  },

  mount(root){
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'done'){ S.setLessonStatus(id, 'done'); LP.app.render(); }
      if (act === 'missed'){ S.setLessonStatus(id, 'missed'); LP.app.render(); }
      if (act === 'cancel'){ S.setLessonStatus(id, 'cancelled'); LP.app.render(); }
      if (act === 'edit') LP.forms.lesson(id, { after: () => LP.app.render() });
      if (act === 'new-lesson') LP.forms.lesson({}, { after: () => LP.app.render() });
      if (act === 'mark-all'){
        const list = pending();
        const ok = await ui.confirm({ title:'Отметить ' + u.nplural(list.length, ['занятие','занятия','занятий']) + '?',
          html:'Все прошедшие занятия без отметки станут <b>проведёнными</b>, их стоимость спишется с баланса учеников.',
          ok:'Да, отметить' });
        if (ok){
          list.forEach(l => S.setLessonStatus(l.id, 'done'));
          ui.toast('Готово', 'Отмечено занятий: ' + list.length, 'ok');
          LP.app.render();
        }
      }
      if (act === 'export'){
        const rows = [['Дата','Время','Ученик','Тема','Что делали','Домашнее задание','Статус','Сумма']]
          .concat(filtered().map(l => [l.date, l.start, S.studentName(l.studentId), l.topic || '', l.notes || '',
            l.homework || '', C.LESSON[l.status].name, S.charge(l)]));
        const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\n');
        ui.download('logopulse-zhurnal-' + d.today() + '.csv', csv, 'text/csv;charset=utf-8');
        ui.toast('Файл создан', 'Откроется в Excel или Google Таблицах', 'ok');
      }
    });
    const apply = u.debounce(() => LP.app.render(), 280);
    root.addEventListener('input', e => {
      const f = e.target.closest('[data-f]'); if (!f) return;
      state[f.dataset.f] = f.value;
      if (f.dataset.f === 'q') apply(); else LP.app.render();
    });
    root.addEventListener('change', e => {
      const f = e.target.closest('[data-f]');
      if (f && f.dataset.f !== 'q'){ state[f.dataset.f] = f.value; LP.app.render(); }
    });
  }
};
})();
