/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Финансы — оплаты, долги, прогноз
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store, ch = LP.chart;
const state = { month: null, student:'' };

function payList(){
  const from = state.month + '-01', to = d.monthEnd(from);
  return u.sortBy(S.db.payments.filter(p => p.date >= from && p.date <= to
    && (!state.student || p.studentId === state.student)), p => p.date, 'desc');
}

/* Вежливое напоминание об оплате — копируется в мессенджер */
function reminderText(st, balance){
  const price = S.priceFor(st) || 1;
  const n = Math.round(-balance / price);
  return 'Здравствуйте' + (st.parent ? ', ' + st.parent.split(' ')[0] : '') + '! '
    + 'Напоминаю про оплату занятий ' + (st.first ? st.first : 'ребёнка') + '. '
    + 'На сегодня к оплате ' + u.money(-balance)
    + (n > 0 ? ' — это ' + u.nplural(n, ['проведённое занятие','проведённых занятия','проведённых занятий']) : '') + '. '
    + 'Спасибо! ' + (S.db.settings.therapist || '');
}

LP.views = LP.views || {};
LP.views.finance = {
  id:'finance', name:'Финансы', icon:'wallet', kicker:'деньги', title:'Финансы',

  render(){
    if (!state.month) state.month = d.mKey(d.today());
    const mm = S.monthMoney(state.month);
    const months = S.byMonth(6);
    const debt = S.debtors();
    const debtSum = u.sum(debt, x => -x.balance);
    const prepaid = u.sum(S.db.students.filter(s => S.balance(s.id) > 0), s => S.balance(s.id));
    const pays = payList();

    /* способы оплаты за месяц */
    const byMethod = Object.keys(C.PAY).map((k, i) => ({
      label: C.PAY[k].name,
      value: u.sum(S.db.payments.filter(p => d.mKey(p.date) === state.month && p.method === k), p => p.amount),
      color: C.PALETTE[i]
    })).filter(x => x.value > 0);

    /* топ учеников по оплатам за месяц */
    const top = u.sortBy(S.db.students.map(s => ({
      label: S.studentName(s.id),
      value: u.sum(S.db.payments.filter(p => p.studentId === s.id && d.mKey(p.date) === state.month), p => p.amount),
      color: s.color
    })).filter(x => x.value > 0), x => x.value, 'desc').slice(0, 7);

    const monthOpts = Array.from({ length: 12 }, (_, i) => d.mKey(d.addMonths(d.today(), -i)));

    return ui.sectionHead({
      kicker:'деньги', title:'Финансы',
      sub:'Два разных числа: «начислено» — сколько вы заработали проведёнными занятиями, «получено» — сколько денег реально пришло. Разница и есть долг.',
      actions:'<button class="btn btn--good" data-act="add-pay">' + ui.icon('plus') + ' Записать оплату</button>'
        + '<button class="btn" data-act="export">' + ui.icon('download') + ' CSV</button>'
    })
    + ui.hint('finance', 'Деньги списываются с баланса ученика <b>в момент, когда вы отмечаете занятие проведённым</b>. Пропуск списывается или нет — это настраивается в «Настройках».')
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'wallet', color:'var(--c-lime)', label:'Получено за месяц',
          value: u.moneyShort(mm.paid) + ' <small>' + S.db.settings.currency + '</small>',
          sub: u.nplural(S.db.payments.filter(p => d.mKey(p.date) === state.month).length, ['платёж','платежа','платежей']),
          spark: ch.spark(months.map(m => m.paid), { color:'#6ee7a0' }) })
      + ui.kpi({ icon:'check', color:'var(--c-cyan)', label:'Начислено за месяц',
          value: u.moneyShort(mm.earned) + ' <small>' + S.db.settings.currency + '</small>',
          sub: u.nplural(mm.done, ['проведённое занятие','проведённых занятия','проведённых занятий']) })
      + ui.kpi({ icon:'clock', color:'var(--c-violet)', label:'Ещё ожидается',
          value: u.moneyShort(mm.planned) + ' <small>' + S.db.settings.currency + '</small>',
          sub:'по запланированным занятиям месяца' })
      + ui.kpi({ icon:'warn', color: debtSum ? 'var(--c-red)' : 'var(--c-lime)', label:'Долги',
          value: debtSum ? u.moneyShort(debtSum) + ' <small>' + S.db.settings.currency + '</small>' : 'нет',
          sub: prepaid ? 'предоплат на ' + u.moneyShort(prepaid) : 'предоплат нет' })
    + '</div>'
    + '<div class="grid grid--main">'
      + '<div class="stack">'
        + '<div class="panel panel--accent-lime panel--hud">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('chart') + '</div>'
          + '<div><span class="kicker">полгода</span><h3>Получено и начислено</h3></div></div>'
          + ch.grouped(months.map(m => ({ label:m.label, full:m.full, a:m.paid, b:m.earned })),
              { money:true, na:'Получено', nb:'Начислено', height:250, aria:'Деньги по месяцам' })
          + '<div class="chart-legend"><span><i style="background:linear-gradient(135deg,#22d3ee,#6f7bff)"></i>Получено</span>'
          + '<span><i style="background:linear-gradient(135deg,#ffc24b,#f472b6)"></i>Начислено</span></div>'
        + '</div>'
        + '<div class="panel">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('money') + '</div>'
          + '<div><span class="kicker">история</span><h3>Оплаты</h3></div>'
          + '<div class="row"><select class="select" data-f="month" style="min-height:38px;font-size:13px">'
            + monthOpts.map(k => '<option value="' + k + '"' + (k === state.month ? ' selected' : '') + '>'
              + C.MONN[Number(k.slice(5,7)) - 1] + ' ' + k.slice(0,4) + '</option>').join('') + '</select>'
          + ui.selectStudents(state.student, { attrs:'data-f="student" style="min-height:38px;font-size:13px;width:auto"', any:'Все ученики' })
          + '</div></div>'
          + (pays.length
            ? '<div class="table-wrap" style="--tmax:44vh"><table class="table"><thead><tr>'
              + '<th>Дата</th><th>Ученик</th><th>Способ</th><th>Комментарий</th><th class="right">Сумма</th><th></th></tr></thead><tbody>'
              + pays.map(p => '<tr><td class="nowrap">' + d.fmtShort(p.date) + '</td>'
                + '<td><div class="row" style="gap:8px">' + ui.ava(S.student(p.studentId), 'xs')
                  + '<span class="trunc" style="max-width:150px">' + u.esc(S.studentName(p.studentId)) + '</span></div></td>'
                + '<td><span class="paychip">' + ui.icon((C.PAY[p.method]||C.PAY.other).icon) + (C.PAY[p.method]||C.PAY.other).name + '</span></td>'
                + '<td class="muted" style="font-size:12.5px">' + u.esc(p.comment || '—') + '</td>'
                + '<td class="right money money--pos">+' + u.money(p.amount) + '</td>'
                + '<td class="right"><button class="kmini" data-act="del-pay" data-id="' + p.id + '">' + ui.icon('trash') + '</button></td></tr>').join('')
              + '<tr><td colspan="4" class="right"><b>Итого за месяц</b></td>'
              + '<td class="right money money--pos"><b>' + u.money(u.sum(pays, p => p.amount)) + '</b></td><td></td></tr>'
              + '</tbody></table></div>'
            : ui.empty({ icon:'wallet', title:'В этом месяце оплат нет',
                text:'Как только родитель заплатит — нажмите «Записать оплату», и баланс ребёнка обновится.',
                action:'<button class="btn btn--good btn--sm" data-act="add-pay">' + ui.icon('plus') + ' Записать оплату</button>' }))
        + '</div>'
      + '</div>'
      + '<div class="stack">'
        + '<div class="panel panel--accent-red">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('warn') + '</div>'
          + '<div><span class="kicker">кто должен</span><h3>Задолженности</h3></div>'
          + '<span class="badge' + (debt.length ? ' badge--red' : ' badge--soft') + '">' + debt.length + '</span></div>'
          + (debt.length
            ? '<div class="list">' + debt.map(x =>
              '<div class="tile" style="cursor:default">' + ui.ava(x.student, 'xs')
              + '<div class="grow" style="min-width:0"><div class="tile__t trunc">' + u.esc(S.studentName(x.student.id)) + '</div>'
              + '<div class="tile__s">' + u.esc(x.student.parent || 'родитель не указан') + '</div></div>'
              + '<div class="tile__end"><div class="money money--neg">' + u.money(x.balance) + '</div>'
              + '<div class="row" style="gap:4px;margin-top:5px;justify-content:flex-end">'
                + '<button class="kmini" data-act="remind" data-id="' + x.student.id + '" data-tip="Скопировать напоминание">' + ui.icon('copy') + '</button>'
                + '<button class="kmini" data-act="pay-for" data-id="' + x.student.id + '" data-tip="Записать оплату">' + ui.icon('wallet') + '</button>'
                + '<button class="kmini" data-act="open" data-id="' + x.student.id + '" data-tip="Карточка">' + ui.icon('right') + '</button>'
              + '</div></div></div>').join('') + '</div>'
              + '<div class="hr"></div><div class="spread"><span class="dim" style="font-size:12.5px">Всего к получению</span>'
              + '<span class="money money--neg" style="font-size:17px">' + u.money(debtSum) + '</span></div>'
            : ui.empty({ icon:'shield', title:'Долгов нет', text:'Все проведённые занятия оплачены. Отличная работа!' }))
        + '</div>'
        + (byMethod.length ? '<div class="panel panel--accent-violet">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('card') + '</div>'
          + '<div><span class="kicker">за месяц</span><h3>Чем платят</h3></div></div>'
          + '<div class="center">' + ch.donut(byMethod, { money:true, centerSub:'за месяц', size:180 }) + '</div>'
          + '<div class="chart-legend" style="justify-content:center">' + byMethod.map(m =>
            '<span><i style="background:' + m.color + '"></i>' + m.label + ' · ' + u.moneyShort(m.value) + '</span>').join('') + '</div>'
          + '</div>' : '')
        + (top.length ? '<div class="panel panel--accent-cyan">'
          + '<div class="panel__head"><div class="panel__icon">' + ui.icon('star') + '</div>'
          + '<div><span class="kicker">за месяц</span><h3>Кто принёс больше</h3></div></div>'
          + ch.hbars(top, { money:true, labelW:118 }) + '</div>' : '')
      + '</div>'
    + '</div>';
  },

  mount(root){
    root.addEventListener('click', async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act, id = b.dataset.id;
      if (act === 'add-pay') LP.forms.payment({}, { after: () => LP.app.render() });
      if (act === 'pay-for') LP.forms.payment({ studentId:id, amount: Math.abs(S.balance(id)) }, { after: () => LP.app.render() });
      if (act === 'open') LP.views.students.card(id);
      if (act === 'remind'){
        const st = S.student(id);
        ui.copy(reminderText(st, S.balance(id)));
      }
      if (act === 'del-pay'){
        const ok = await ui.confirm({ danger:true, title:'Удалить оплату?', text:'Баланс ученика пересчитается.', ok:'Удалить' });
        if (ok){ S.delPayment(id); LP.app.render(); }
      }
      if (act === 'export'){
        const rows = [['Дата','Ученик','Способ','Комментарий','Сумма']]
          .concat(u.sortBy(S.db.payments, p => p.date).map(p =>
            [p.date, S.studentName(p.studentId), (C.PAY[p.method]||C.PAY.other).name, p.comment || '', p.amount]));
        const csv = '﻿' + rows.map(r => r.map(c => '"' + String(c).replace(/"/g,'""') + '"').join(';')).join('\n');
        ui.download('logopulse-oplaty-' + d.today() + '.csv', csv, 'text/csv;charset=utf-8');
        ui.toast('Файл создан', 'Все оплаты выгружены', 'ok');
      }
    });
    root.addEventListener('change', e => {
      const f = e.target.closest('[data-f]');
      if (f){ state[f.dataset.f] = f.value; LP.app.render(); }
    });
  }
};
})();
