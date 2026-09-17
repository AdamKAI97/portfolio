/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Ученики — список и карточка ребёнка
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;
const state = { q:'', stage:'', sort:'name', mode:'grid' };

function list(){
  let arr = S.db.students.filter(s => !s.archived);
  if (state.stage) arr = arr.filter(s => s.stage === state.stage);
  if (state.q) arr = arr.filter(s => u.match([s.first, s.last, s.parent, s.phone, s.diagnosis, s.messenger].join(' '), state.q));
  const key = {
    name: s => (s.first + ' ' + s.last).toLowerCase(),
    next: s => { const n = S.stats(s.id).next; return n ? n.date + n.start : '9999'; },
    debt: s => S.balance(s.id),
    quiet: s => { const l = S.stats(s.id).last; return l ? l.date : '0000'; }
  }[state.sort];
  return u.sortBy(arr, key);
}

function card(s){
  const st = S.stats(s.id);
  const stage = C.STAGES.find(x => x.id === s.stage) || C.STAGES[0];
  return '<button class="scard" data-open="' + s.id + '" style="--sc:' + s.color + '">'
    + '<div class="scard__top">' + ui.ava(s)
      + '<div class="grow" style="min-width:0">'
        + '<div class="scard__name trunc">' + u.esc(S.studentName(s.id)) + '</div>'
        + '<div class="scard__meta trunc">' + (d.ageText(s.birth) || 'возраст не указан')
          + (s.diagnosis && s.diagnosis !== '—' ? ' · ' + u.esc(s.diagnosis) : '') + '</div>'
      + '</div>'
      + ui.ring(st.soundPct, 46)
    + '</div>'
    + '<div class="row row--wrap" style="gap:6px">' + ui.stageChip(s.stage)
      + (st.next ? '<span class="chip chip--cyan">' + ui.icon('calendar') + d.human(st.next.date) + ', ' + st.next.start + '</span>'
                 : '<span class="chip chip--amber">' + ui.icon('warn') + 'не записан</span>')
      + (st.balance < 0 ? '<span class="chip chip--red">' + ui.icon('wallet') + 'долг ' + u.moneyShort(-st.balance) + '</span>' : '')
    + '</div>'
    + '<div class="scard__stats">'
      + '<div class="scard__stat"><b>' + st.done + '</b><small>проведено</small></div>'
      + '<div class="scard__stat"><b>' + (st.attendance == null ? '—' : st.attendance + '%') + '</b><small>приходит</small></div>'
      + '<div class="scard__stat"><b style="color:' + (st.balance < 0 ? 'var(--c-red)' : st.balance > 0 ? 'var(--c-lime)' : 'inherit') + '">'
        + (st.balance ? u.moneyShort(st.balance) : '0') + '</b><small>баланс</small></div>'
    + '</div></button>';
}

function table(arr){
  return '<div class="panel panel--pad-0"><div class="table-wrap"><table class="table table--click"><thead><tr>'
    + '<th>Ребёнок</th><th>Этап</th><th>Родитель</th><th>Телефон</th><th>Ближайшее</th><th class="right">Баланс</th><th class="right">Занятий</th>'
    + '</tr></thead><tbody>'
    + arr.map(s => { const st = S.stats(s.id);
      return '<tr data-open="' + s.id + '">'
      + '<td><div class="row">' + ui.ava(s, 'xs') + '<div><div style="font-weight:700">' + u.esc(S.studentName(s.id)) + '</div>'
        + '<div class="dim" style="font-size:11.5px">' + (d.ageText(s.birth) || '—') + '</div></div></div></td>'
      + '<td>' + ui.stageChip(s.stage) + '</td>'
      + '<td class="muted">' + u.esc(s.parent || '—') + '</td>'
      + '<td class="mono" style="font-size:13px">' + u.esc(s.phone || '—') + '</td>'
      + '<td>' + (st.next ? d.fmtShort(st.next.date) + ' ' + st.next.start : '<span class="dim">—</span>') + '</td>'
      + '<td class="right">' + ui.moneyHtml(st.balance) + '</td>'
      + '<td class="right mono">' + st.done + '</td></tr>'; }).join('')
    + '</tbody></table></div></div>';
}

/* ═════ Карточка ученика ═════ */
function tabOverview(s){
  const st = S.stats(s.id);
  const sounds = S.soundsOf(s.id);
  const lastN = u.sortBy(S.lessonsOf(s.id).filter(l => l.status === 'done'), l => l.date, 'desc').slice(0, 3);
  return '<div class="grid grid--3" style="margin-bottom:16px">'
    + ui.kpi({ icon:'check', color:'var(--c-lime)', label:'Проведено', value: st.done + '', sub: st.hours + ' ч работы' })
    + ui.kpi({ icon:'target', color:'var(--c-cyan)', label:'Приходит', value:(st.attendance == null ? '—' : st.attendance + '%'),
        sub: st.missed ? 'пропусков: ' + st.missed : 'без пропусков' })
    + ui.kpi({ icon:'wallet', color: st.balance < 0 ? 'var(--c-red)' : 'var(--c-lime)', label:'Баланс',
        value: u.moneyShort(st.balance), sub: st.balance < 0 ? 'нужно напомнить об оплате'
          : u.nplural(S.prepaidLessons(s.id), ['занятие оплачено','занятия оплачено','занятий оплачено']) })
    + '</div>'
    + '<div class="grid grid--2">'
      + '<div class="panel panel--flat"><div class="panel__head"><div class="panel__icon">' + ui.icon('phone') + '</div>'
        + '<div><span class="kicker">связь</span><h3>Родитель</h3></div></div>'
        + '<dl class="dl">'
          + '<dt>Кто приводит</dt><dd>' + u.esc(s.parent || '—') + '</dd>'
          + '<dt>Телефон</dt><dd>' + (s.phone ? '<a href="' + u.phoneHref(s.phone) + '">' + u.esc(s.phone) + '</a>'
            + ' <button class="kmini" data-copy="' + u.esc(s.phone) + '" title="Скопировать">' + ui.icon('copy') + '</button>' : '—') + '</dd>'
          + '<dt>Мессенджер</dt><dd>' + u.esc(s.messenger || '—') + '</dd>'
          + '<dt>Узнали о вас</dt><dd>' + u.esc(s.source || '—') + '</dd>'
          + '<dt>Занимается с</dt><dd>' + (s.since ? d.fmtFull(s.since) : '—') + '</dd>'
        + '</dl></div>'
      + '<div class="panel panel--flat"><div class="panel__head"><div class="panel__icon">' + ui.icon('brain') + '</div>'
        + '<div><span class="kicker">речь</span><h3>Заключение и цель</h3></div></div>'
        + '<dl class="dl">'
          + '<dt>Заключение</dt><dd>' + u.esc(s.diagnosis || 'не заполнено') + '</dd>'
          + '<dt>Жалоба</dt><dd>' + u.esc(s.complaint || '—') + '</dd>'
          + '<dt>Цель</dt><dd>' + u.esc(s.goal || '—') + '</dd>'
          + '<dt>Звуков в работе</dt><dd>' + sounds.length + ' · готовность ' + st.soundPct + '%</dd>'
        + '</dl>'
        + '<div style="margin-top:12px">' + ui.bar(st.soundPct, st.soundPct >= 70 ? 'good' : '') + '</div></div>'
    + '</div>'
    + (s.notes ? '<div class="panel panel--flat" style="margin-top:16px"><span class="kicker">заметки</span>'
        + '<p style="margin:8px 0 0;white-space:pre-wrap">' + u.esc(s.notes) + '</p></div>' : '')
    + (lastN.length ? '<div class="panel panel--flat" style="margin-top:16px">'
        + '<div class="panel__head"><div class="panel__icon">' + ui.icon('note') + '</div>'
        + '<div><span class="kicker">последние занятия</span><h3>Что делали</h3></div></div>'
        + '<div class="list">' + lastN.map(l => '<div class="tile" style="cursor:default;align-items:flex-start">'
          + '<span class="chip chip--lime" style="flex:none">' + d.fmtShort(l.date) + '</span>'
          + '<div class="grow"><div class="tile__t" style="font-size:13.5px">' + u.esc(l.topic || 'без темы') + '</div>'
          + (l.notes ? '<div class="tile__s">' + u.esc(l.notes) + '</div>' : '')
          + (l.homework ? '<div class="tile__s" style="color:var(--c-amber)">🏠 ' + u.esc(l.homework) + '</div>' : '')
          + '</div></div>').join('') + '</div></div>' : '');
}

function tabLessons(s){
  const arr = u.sortBy(S.lessonsOf(s.id), l => l.date + l.start, 'desc');
  if (!arr.length) return ui.empty({ icon:'calendar', title:'Занятий ещё не было',
    text:'Запишите первое занятие — здесь появится вся история.',
    action:'<button class="btn btn--primary btn--sm" data-act="add-lesson">' + ui.icon('plus') + ' Записать</button>' });
  return '<div class="row" style="margin-bottom:12px"><button class="btn btn--sm btn--primary" data-act="add-lesson">'
    + ui.icon('plus') + ' Записать занятие</button>'
    + '<span class="dim" style="font-size:12.5px;margin-left:auto">Всего записей: ' + arr.length + '</span></div>'
    + '<div class="panel panel--pad-0"><div class="table-wrap" style="--tmax:56vh"><table class="table"><thead><tr>'
    + '<th>Дата</th><th>Тема и заметки</th><th>Статус</th><th class="right">Цена</th><th></th></tr></thead><tbody>'
    + arr.map(l => '<tr>'
      + '<td class="nowrap"><b>' + d.fmtShort(l.date) + '</b><div class="dim mono" style="font-size:11.5px">' + l.start + '</div></td>'
      + '<td><div style="font-weight:600">' + u.esc(l.topic || '—') + '</div>'
        + (l.notes ? '<div class="dim" style="font-size:12px">' + u.esc(l.notes) + '</div>' : '')
        + (l.homework ? '<div style="font-size:12px;color:var(--c-amber)">🏠 ' + u.esc(l.homework) + '</div>' : '') + '</td>'
      + '<td>' + ui.lessonChip(l.status) + '</td>'
      + '<td class="right mono">' + (S.charge(l) ? u.moneyShort(S.charge(l)) : '—') + '</td>'
      + '<td class="right"><button class="kmini" data-act="edit-lesson" data-id="' + l.id + '">' + ui.icon('edit') + '</button></td>'
      + '</tr>').join('') + '</tbody></table></div></div>';
}

function tabMoney(s){
  const pays = u.sortBy(S.paymentsOf(s.id), p => p.date, 'desc');
  const st = S.stats(s.id);
  const charged = u.sum(S.lessonsOf(s.id), S.charge);
  const total = Math.max(st.revenue, charged, 1);
  return '<div class="panel panel--flat" style="margin-bottom:16px">'
    + '<div class="spread" style="margin-bottom:12px"><div><span class="kicker">текущий баланс</span>'
    + '<div>' + ui.moneyHtml(st.balance, true) + '</div>'
    + '<div class="dim" style="font-size:12.5px">' + (st.balance < 0 ? 'ученик должен за проведённые занятия'
        : st.balance > 0 ? 'оплачено вперёд: ' + u.nplural(S.prepaidLessons(s.id), ['занятие','занятия','занятий']) : 'всё ровно') + '</div></div>'
    + '<button class="btn btn--good" data-act="add-pay">' + ui.icon('plus') + ' Записать оплату</button></div>'
    + '<div class="balance-bar">'
      + '<div style="width:' + (st.revenue / total * 100) + '%;background:var(--grad-good)">получено ' + u.moneyShort(st.revenue) + '</div>'
      + '<div style="width:' + (charged / total * 100) + '%;background:var(--grad-warm)">начислено ' + u.moneyShort(charged) + '</div>'
    + '</div></div>'
    + (pays.length ? '<div class="panel panel--pad-0"><div class="table-wrap" style="--tmax:46vh"><table class="table"><thead><tr>'
      + '<th>Дата</th><th>Способ</th><th>Комментарий</th><th class="right">Сумма</th><th></th></tr></thead><tbody>'
      + pays.map(p => '<tr><td class="nowrap">' + d.fmtShort(p.date) + '</td>'
        + '<td><span class="paychip">' + ui.icon((C.PAY[p.method]||C.PAY.other).icon) + (C.PAY[p.method]||C.PAY.other).name + '</span></td>'
        + '<td class="muted">' + u.esc(p.comment || '—') + '</td>'
        + '<td class="right money money--pos">+' + u.money(p.amount) + '</td>'
        + '<td class="right"><button class="kmini" data-act="del-pay" data-id="' + p.id + '" title="Удалить">' + ui.icon('trash') + '</button></td></tr>').join('')
      + '</tbody></table></div></div>'
      : ui.empty({ icon:'wallet', title:'Оплат пока нет', text:'Как только родитель заплатит — запишите сумму, и баланс пересчитается сам.' }));
}

function drawerBody(s, tab){
  if (tab === 'lessons') return tabLessons(s);
  if (tab === 'speech')  return LP.views.progress.board(s.id, true);
  if (tab === 'money')   return tabMoney(s);
  return tabOverview(s);
}

function openCard(id, tab){
  const s = S.student(id);
  if (!s) return ui.toast('Карточка не найдена', '', 'err');
  tab = tab || 'over';
  const st = S.stats(s.id);
  const head =
      '<div class="row" style="align-items:flex-start">'
      + '<div class="ava ava--lg" style="background:linear-gradient(140deg,' + s.color + ',' + ui.shade(s.color,-28) + ');color:'
        + ui.readable(s.color) + '">' + (s.emoji || u.initials(s.first, s.last)) + '<span class="ava__ring"></span></div>'
      + '<div class="grow" style="min-width:0">'
        + '<span class="kicker">карточка ученика</span>'
        + '<h2 style="font-size:23px">' + u.esc(S.studentName(s.id)) + '</h2>'
        + '<div class="row row--wrap" style="gap:6px;margin-top:7px">' + ui.stageChip(s.stage)
          + (d.ageText(s.birth) ? '<span class="chip">' + d.ageText(s.birth) + '</span>' : '')
          + (st.next ? '<span class="chip chip--cyan">' + ui.icon('calendar') + d.human(st.next.date) + ', ' + st.next.start + '</span>' : '')
        + '</div>'
      + '</div>'
      + '<button class="modal__x" data-close aria-label="Закрыть">' + ui.icon('x') + '</button>'
      + '</div>'
      + '<div class="row row--wrap" style="margin-top:14px;gap:8px">'
        + (s.phone ? '<a class="btn btn--sm" href="' + u.phoneHref(s.phone) + '">' + ui.icon('phone') + ' Позвонить</a>' : '')
        + '<button class="btn btn--sm btn--primary" data-act="add-lesson">' + ui.icon('calendar') + ' Записать</button>'
        + '<button class="btn btn--sm btn--good" data-act="add-pay">' + ui.icon('wallet') + ' Оплата</button>'
        + '<button class="btn btn--sm" data-act="edit">' + ui.icon('edit') + ' Изменить</button>'
        + '<select class="select" data-stage style="width:auto;min-height:36px;padding:6px 34px 6px 12px;font-size:13px">'
          + C.STAGES.map(x => '<option value="' + x.id + '"' + (x.id === s.stage ? ' selected' : '') + '>' + x.name + '</option>').join('')
        + '</select>'
      + '</div>'
      + '<div style="margin-top:14px">' + ui.tabs([
          { id:'over',    name:'Обзор' },
          { id:'lessons', name:'Занятия', n: S.lessonsOf(s.id).length },
          { id:'speech',  name:'Речь',    n: S.soundsOf(s.id).length },
          { id:'money',   name:'Деньги' }
        ], tab) + '</div>';

  const h = ui.drawer({ head, body: drawerBody(s, tab) });

  const rerender = t => {
    const cur = t || LP.$('.tabs .is-on', h.el).dataset.tab;
    h.body.innerHTML = drawerBody(S.student(id), cur);
  };
  h.el.addEventListener('click', async e => {
    const tb = e.target.closest('[data-tab]');
    if (tb){
      LP.$$('.tabs button', h.el).forEach(b => b.classList.toggle('is-on', b === tb));
      return rerender(tb.dataset.tab);
    }
    const cp = e.target.closest('[data-copy]');
    if (cp) return ui.copy(cp.dataset.copy);
    const b = e.target.closest('[data-act]'); if (!b) return;
    const act = b.dataset.act;
    if (act === 'edit') LP.forms.student(id, { after: st2 => { h.close(); LP.app.render(); if (st2) openCard(id); } });
    if (act === 'add-lesson') LP.forms.lesson({ studentId:id }, { after: () => { rerender(); LP.app.render(); } });
    if (act === 'edit-lesson') LP.forms.lesson(b.dataset.id, { after: () => { rerender(); LP.app.render(); } });
    if (act === 'add-pay') LP.forms.payment({ studentId:id }, { after: () => { rerender(); LP.app.render(); } });
    if (act === 'del-pay'){
      const ok = await ui.confirm({ danger:true, title:'Удалить оплату?', text:'Баланс ученика пересчитается.', ok:'Удалить' });
      if (ok){ S.delPayment(b.dataset.id); rerender(); LP.app.render(); }
    }
    if (act === 'sound-add' || act === 'sound-up' || act === 'sound-down' || act === 'sound-del'){
      LP.views.progress.handle(act, b, id);
      rerender('speech'); LP.app.render();
    }
  });
  h.el.addEventListener('change', e => {
    if (e.target.matches('[data-stage]')){
      S.setStage(id, e.target.value);
      ui.toast('Этап изменён', S.studentName(id) + ' → ' + (C.STAGES.find(x => x.id === e.target.value)||{}).name, 'ok');
      LP.app.render();
    }
  });
  return h;
}

LP.views = LP.views || {};
LP.views.students = {
  id:'students', name:'Ученики', icon:'users', kicker:'картотека', title:'Ученики',
  card: openCard,

  render(){
    const arr = list();
    const all = S.db.students.filter(s => !s.archived);
    const counts = {};
    C.STAGES.forEach(x => counts[x.id] = all.filter(s => s.stage === x.id).length);
    return ui.sectionHead({
      kicker:'картотека', title:'Ученики',
      sub:'Все дети, с которыми вы работаете. Нажмите на карточку — откроется полная история: занятия, звуки, оплаты.',
      actions:'<button class="btn btn--primary" data-act="new">' + ui.icon('plus') + ' Новый ученик</button>'
    })
    + ui.hint('students', 'Карточка — это <b>вся история ребёнка в одном месте</b>. Цветное кольцо показывает, насколько поставлены звуки, а «баланс» — оплачено вперёд (зелёный) или есть долг (красный).')
    + '<div class="filters">'
      + '<input class="input" data-filter="q" value="' + u.esc(state.q) + '" placeholder="Поиск по имени, родителю, телефону…" style="min-width:250px">'
      + '<select class="select" data-filter="stage"><option value="">Все этапы (' + all.length + ')</option>'
        + C.STAGES.map(x => '<option value="' + x.id + '"' + (state.stage === x.id ? ' selected' : '') + '>'
          + x.name + ' (' + counts[x.id] + ')</option>').join('') + '</select>'
      + '<select class="select" data-filter="sort">'
        + [['name','Сортировка: по имени'],['next','Сортировка: ближайшее занятие'],['debt','Сортировка: сначала должники'],['quiet','Сортировка: давно не были']]
          .map(o => '<option value="' + o[0] + '"' + (state.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>'
      + '<div class="seg" style="margin-left:auto">'
        + '<button data-mode="grid" class="' + (state.mode === 'grid' ? 'is-on' : '') + '">' + ui.icon('grid') + '</button>'
        + '<button data-mode="table" class="' + (state.mode === 'table' ? 'is-on' : '') + '">' + ui.icon('list') + '</button>'
      + '</div>'
    + '</div>'
    + (!arr.length
      ? ui.empty({ icon:'users', title: all.length ? 'Никого не нашлось' : 'Здесь пока пусто',
          text: all.length ? 'Попробуйте изменить фильтры или очистить поиск.'
                           : 'Добавьте первого ребёнка — и платформа начнёт вести его историю.',
          action:'<button class="btn btn--primary" data-act="new">' + ui.icon('plus') + ' Добавить ученика</button>' })
      : state.mode === 'table' ? table(arr) : '<div class="grid grid--cards">' + arr.map(card).join('') + '</div>');
  },

  mount(root){
    root.addEventListener('click', e => {
      const o = e.target.closest('[data-open]');
      if (o) return openCard(o.dataset.open);
      const m = e.target.closest('[data-mode]');
      if (m){ state.mode = m.dataset.mode; return LP.app.render(); }
      const b = e.target.closest('[data-act]');
      if (b && b.dataset.act === 'new') LP.forms.student(null, { after: s => { LP.app.render(); if (s) openCard(s.id); } });
    });
    const apply = u.debounce(() => LP.app.render(), 260);
    root.addEventListener('input', e => {
      const f = e.target.closest('[data-filter]'); if (!f) return;
      state[f.dataset.filter] = f.value;
      if (f.dataset.filter === 'q') apply(); else LP.app.render();
    });
    root.addEventListener('change', e => {
      const f = e.target.closest('[data-filter]');
      if (f && f.dataset.filter !== 'q'){ state[f.dataset.filter] = f.value; LP.app.render(); }
    });
  }
};
})();
