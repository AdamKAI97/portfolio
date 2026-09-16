/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Отчёты — аналитика и выводы простым языком
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store, ch = LP.chart;
const state = { months: 6 };

function heatMatrix(days){
  const from = d.add(d.today(), -days);
  const s = S.db.settings;
  const start = d.t2m(s.dayStart || '09:00'), end = d.t2m(s.dayEnd || '19:00');
  const hours = [];
  for (let m = start; m < end; m += 60) hours.push(d.m2t(m));
  const matrix = Array.from({ length: 7 }, () => hours.map(() => 0));
  S.db.lessons.filter(l => l.date >= from && l.status !== 'cancelled').forEach(l => {
    const hi = Math.floor((d.t2m(l.start) - start) / 60);
    if (hi >= 0 && hi < hours.length) matrix[d.dow(l.date)][hi]++;
  });
  return { matrix, hours };
}

/* Автоматические выводы — то, что вы бы сами сказали, глядя на цифры */
function insights(){
  const out = [];
  const t = d.today();
  const cur = S.monthMoney(d.mKey(t));
  const tr = S.monthTrend();
  if (tr.pct != null && Math.abs(tr.pct) >= 5){
    out.push({ tone: tr.pct > 0 ? 'lime' : 'amber', icon: tr.pct > 0 ? 'up' : 'down',
      text:'С 1 по ' + tr.day + ' число получено <b>' + u.moneyShort(tr.cur) + '</b> — это на <b>'
        + Math.abs(tr.pct) + '%</b> ' + (tr.pct > 0 ? 'больше' : 'меньше')
        + ', чем за те же дни прошлого месяца (' + u.moneyShort(tr.prev) + ').' });
  }
  const missRate = (cur.done + cur.missed) ? Math.round(cur.missed / (cur.done + cur.missed) * 100) : 0;
  if (missRate >= 15) out.push({ tone:'red', icon:'warn',
    text:'Пропусков в этом месяце <b>' + missRate + '%</b>. Это много — возможно, стоит напомнить родителям правило отмены за сутки.' });
  else if (cur.done) out.push({ tone:'lime', icon:'check',
    text:'Дети приходят стабильно: пропусков всего <b>' + missRate + '%</b> за месяц.' });

  const debt = S.debtors();
  if (debt.length) out.push({ tone:'amber', icon:'wallet',
    text:'Не оплачено занятий на <b>' + u.money(u.sum(debt, x => -x.balance)) + '</b> — у '
      + u.nplural(debt.length, ['ученика','учеников','учеников']) + '. Напоминание можно скопировать в разделе «Финансы».' });

  const leads = S.db.students.filter(s => s.stage === 'lead');
  if (leads.length) out.push({ tone:'violet', icon:'inbox',
    text:'В воронке <b>' + u.nplural(leads.length, ['новая заявка','новые заявки','новых заявок'])
      + '</b> без ответа. Каждый день ожидания снижает шанс, что родитель дойдёт.' });

  const load = S.loadByWeekday(56);
  const work = (S.db.settings.workDays || [0,1,2,3,4,5]);
  const maxI = load.indexOf(Math.max(...load));
  if (Math.max(...load) > 0){
    const quiet = u.sortBy(work.filter(i => i !== maxI), i => load[i])[0];
    out.push({ tone:'cyan', icon:'calendar',
      text:'Самый загруженный день — <b>' + C.WD[maxI].toLowerCase() + '</b>: ' + u.nplural(load[maxI], ['занятие','занятия','занятий'])
        + ' за 8 недель.' + (quiet != null ? ' Свободнее всего ' + C.WDA[quiet] + ' — '
        + u.nplural(load[quiet], ['занятие','занятия','занятий']) + '.' : '') });
  }

  const wins = S.db.sounds.filter(x => x.stage === 5).length;
  if (wins) out.push({ tone:'pink', icon:'medal',
    text:'Доведено до свободной речи <b>' + u.nplural(wins, ['звук','звука','звуков']) + '</b>. Это то, ради чего всё и делается.' });
  return out;
}

LP.views = LP.views || {};
LP.views.reports = {
  id:'reports', name:'Отчёты', icon:'chart', kicker:'аналитика', title:'Отчёты и аналитика',

  render(){
    const months = S.byMonth(state.months);
    const totalPaid = u.sum(months, m => m.paid);
    const avg = Math.round(totalPaid / Math.max(1, months.filter(m => m.paid > 0).length));
    const allDone = S.db.lessons.filter(l => l.status === 'done');
    const allMissed = S.db.lessons.filter(l => l.status === 'missed');
    const att = (allDone.length + allMissed.length) ? Math.round(allDone.length / (allDone.length + allMissed.length) * 100) : null;
    const check = allDone.length ? Math.round(u.sum(allDone, l => Number(l.price)||0) / allDone.length) : 0;
    const hm = heatMatrix(56);
    const load = S.loadByWeekday(56);

    const srcCounts = {};
    S.db.students.forEach(s => { const k = s.source || 'Не указано'; srcCounts[k] = (srcCounts[k]||0) + 1; });
    const sources = u.sortBy(Object.keys(srcCounts).map((k, i) => ({ label:k, value:srcCounts[k], color:C.PALETTE[i % 8] })), x => x.value, 'desc');

    const funnel = C.STAGES.map(st => ({
      label: st.name, color: st.color,
      value: S.db.students.filter(s => s.stage === st.id).length
    }));

    const rows = u.sortBy(S.db.students.filter(s => !s.archived).map(s => {
      const x = S.stats(s.id);
      return { s, x };
    }), r => -r.x.done);

    return ui.sectionHead({
      kicker:'аналитика', title:'Отчёты и аналитика',
      sub:'Взгляд на практику сверху: сколько работаете, сколько зарабатываете, где теряете. Ниже — выводы обычными словами, без таблиц.',
      actions:'<div class="seg">' + [3,6,12].map(n => '<button data-m="' + n + '" class="' + (state.months === n ? 'is-on' : '') + '">'
          + n + ' мес.</button>').join('') + '</div>'
        + '<button class="btn" data-act="print">' + ui.icon('print') + ' Распечатать</button>'
    })
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'wallet', color:'var(--c-lime)', label:'Получено за период',
          value: u.moneyShort(totalPaid) + ' <small>' + S.db.settings.currency + '</small>',
          sub:'в среднем ' + u.moneyShort(avg) + ' в месяц', spark: ch.spark(months.map(m => m.paid), { color:'#6ee7a0' }) })
      + ui.kpi({ icon:'book', color:'var(--c-cyan)', label:'Занятий проведено', value: allDone.length + '',
          sub: Math.round(u.sum(allDone, l => l.dur||45) / 60) + ' часов за всё время' })
      + ui.kpi({ icon:'target', color:'var(--c-violet)', label:'Средняя посещаемость',
          value:(att == null ? '—' : att + '%'), sub: allMissed.length + ' пропусков всего' })
      + ui.kpi({ icon:'money', color:'var(--c-amber)', label:'Средний чек занятия',
          value: u.moneyShort(check) + ' <small>' + S.db.settings.currency + '</small>', sub:'по проведённым занятиям' })
    + '</div>'

    /* ── выводы ── */
    + '<div class="panel panel--accent-cyan panel--hud" style="margin-bottom:18px">'
      + '<div class="panel__head"><div class="panel__icon">' + ui.icon('brain') + '</div>'
      + '<div><span class="kicker">если коротко</span><h3>Что говорят цифры</h3></div></div>'
      + '<div class="list">' + insights().map(i =>
        '<div class="tile" style="cursor:default;align-items:flex-start">'
        + '<span class="chip chip--' + i.tone + '" style="flex:none;padding:7px">' + ui.icon(i.icon) + '</span>'
        + '<div class="grow" style="font-size:13.5px;line-height:1.5">' + i.text + '</div></div>').join('') + '</div>'
    + '</div>'

    + '<div class="grid grid--2" style="margin-bottom:18px">'
      + '<div class="panel"><div class="panel__head"><div class="panel__icon">' + ui.icon('chart') + '</div>'
        + '<div><span class="kicker">деньги</span><h3>Поступления по месяцам</h3></div></div>'
        + ch.area(months.map(m => ({ label:m.label, full:m.full, value:m.paid })), { money:true, grad:'good', height:230, aria:'Поступления' })
      + '</div>'
      + '<div class="panel"><div class="panel__head"><div class="panel__icon">' + ui.icon('book') + '</div>'
        + '<div><span class="kicker">нагрузка</span><h3>Проведено занятий</h3></div></div>'
        + ch.bars(months.map(m => ({ label:m.label, value:m.lessons })), { height:230, aria:'Занятия по месяцам' })
      + '</div>'
    + '</div>'

    + '<div class="grid grid--2" style="margin-bottom:18px">'
      + '<div class="panel"><div class="panel__head"><div class="panel__icon">' + ui.icon('calendar') + '</div>'
        + '<div><span class="kicker">8 недель</span><h3>Когда вы заняты</h3></div></div>'
        + ch.bars(C.WDS.map((w, i) => ({ label:w, value:load[i],
            color: i === load.indexOf(Math.max(...load)) ? 'var(--c-pink)' : null })), { height:190, aria:'Загрузка по дням' })
        + '<div class="hr"></div><span class="kicker">по часам и дням</span><div style="margin-top:10px">'
        + ch.heat(hm.matrix, { hours: hm.hours }) + '</div>'
      + '</div>'
      + '<div class="stack">'
        + '<div class="panel"><div class="panel__head"><div class="panel__icon">' + ui.icon('inbox') + '</div>'
          + '<div><span class="kicker">откуда дети</span><h3>Источники заявок</h3></div></div>'
          + '<div class="center">' + ch.donut(sources, { size:180, centerSub:'всего детей' }) + '</div>'
          + '<div class="chart-legend" style="justify-content:center">' + sources.slice(0,6).map(s =>
            '<span><i style="background:' + s.color + '"></i>' + u.esc(s.label) + ' · ' + s.value + '</span>').join('') + '</div>'
        + '</div>'
        + '<div class="panel"><div class="panel__head"><div class="panel__icon">' + ui.icon('kanban') + '</div>'
          + '<div><span class="kicker">воронка</span><h3>Где сейчас дети</h3></div></div>'
          + ch.hbars(funnel, { labelW:120 }) + '</div>'
      + '</div>'
    + '</div>'

    /* ── таблица по ученикам ── */
    + '<div class="panel panel--pad-0"><div style="padding:20px 20px 0"><div class="panel__head">'
      + '<div class="panel__icon">' + ui.icon('users') + '</div>'
      + '<div><span class="kicker">по каждому</span><h3>Сводка по ученикам</h3></div>'
      + '<button class="btn btn--sm" data-act="export">' + ui.icon('download') + ' CSV</button></div></div>'
      + '<div class="table-wrap" style="--tmax:56vh"><table class="table"><thead><tr>'
      + '<th>Ученик</th><th>Этап</th><th class="right">Провед.</th><th class="right">Пропуск</th>'
      + '<th class="right">Приходит</th><th class="right">Оплачено</th><th class="right">Баланс</th><th>Речь</th></tr></thead><tbody>'
      + rows.map(r => '<tr>'
        + '<td><div class="row" style="gap:8px">' + ui.ava(r.s, 'xs') + '<span>' + u.esc(S.studentName(r.s.id)) + '</span></div></td>'
        + '<td>' + ui.stageChip(r.s.stage) + '</td>'
        + '<td class="right mono">' + r.x.done + '</td>'
        + '<td class="right mono">' + r.x.missed + '</td>'
        + '<td class="right mono">' + (r.x.attendance == null ? '—' : r.x.attendance + '%') + '</td>'
        + '<td class="right mono">' + u.moneyShort(r.x.revenue) + '</td>'
        + '<td class="right">' + ui.moneyHtml(r.x.balance) + '</td>'
        + '<td style="min-width:120px">' + ui.bar(r.x.soundPct, r.x.soundPct >= 70 ? 'good' : '') + '</td></tr>').join('')
      + '</tbody></table></div></div>';
  },

  mount(root){
    root.addEventListener('click', e => {
      const m = e.target.closest('[data-m]');
      if (m){ state.months = Number(m.dataset.m); return LP.app.render(); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'print') window.print();
      if (b.dataset.act === 'export'){
        const rows = [['Ученик','Этап','Проведено','Пропусков','Посещаемость %','Оплачено','Баланс','Прогресс речи %']]
          .concat(S.db.students.map(s => { const x = S.stats(s.id);
            return [S.studentName(s.id), (C.STAGES.find(y => y.id === s.stage)||{}).name, x.done, x.missed,
              x.attendance == null ? '' : x.attendance, x.revenue, x.balance, x.soundPct]; }));
        const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\n');
        ui.download('logopulse-svodka-' + d.today() + '.csv', csv, 'text/csv;charset=utf-8');
        ui.toast('Файл создан', 'Сводка по всем ученикам', 'ok');
      }
    });
  }
};
})();
