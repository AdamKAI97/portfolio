/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Воронка приёма — от заявки до постоянного ученика
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;

function kcard(s, idx){
  const st = S.stats(s.id);
  const days = s.stageAt ? d.diff(s.stageAt, d.today()) : (s.since ? d.diff(s.since, d.today()) : 0);
  return '<div class="kcard" draggable="true" data-sid="' + s.id + '" style="--kc:' + s.color + '">'
    + '<div class="kcard__top">' + ui.ava(s, 'xs')
      + '<div class="grow" style="min-width:0"><div class="kcard__name trunc">' + u.esc(S.studentName(s.id)) + '</div>'
      + '<div class="kcard__sub trunc">' + (d.ageText(s.birth) || 'возраст —')
        + (s.source ? ' · ' + u.esc(s.source) : '') + '</div></div>'
    + '</div>'
    + (s.complaint ? '<div class="kcard__sub" style="color:var(--txt-2);line-height:1.4">'
        + u.esc(s.complaint.length > 78 ? s.complaint.slice(0, 78) + '…' : s.complaint) + '</div>' : '')
    + '<div class="kcard__foot">'
      + (s.phone ? '<a class="chip" href="' + u.phoneHref(s.phone) + '" onclick="event.stopPropagation()">' + ui.icon('phone') + 'звонок</a>' : '')
      + (st.next ? '<span class="chip chip--cyan">' + d.human(st.next.date) + '</span>'
        : (idx > 2 ? '' : '<span class="chip chip--amber">нет записи</span>'))
      + (days > 0 ? '<span class="chip" data-tip="Столько дней на этом этапе">' + days + ' дн.</span>' : '')
      + '<div class="kcard__move">'
        + '<button class="kmini" data-move="-1" data-sid="' + s.id + '" data-tip="Назад">' + ui.icon('left') + '</button>'
        + '<button class="kmini" data-open="' + s.id + '" data-tip="Открыть карточку">' + ui.icon('note') + '</button>'
        + '<button class="kmini" data-move="1" data-sid="' + s.id + '" data-tip="Дальше по воронке">' + ui.icon('right') + '</button>'
      + '</div>'
    + '</div></div>';
}

LP.views = LP.views || {};
LP.views.pipeline = {
  id:'pipeline', name:'Воронка приёма', icon:'kanban', kicker:'приём', title:'Воронка приёма',

  render(){
    const all = S.db.students.filter(s => !s.archived);
    const byStage = {};
    C.STAGES.forEach(x => byStage[x.id] = all.filter(s => s.stage === x.id));
    const leads = all.filter(s => ['lead','diagnostic','trial'].includes(s.stage)).length;
    const reached = all.filter(s => ['active','paused','done'].includes(s.stage)).length;
    const conv = (leads + reached) ? Math.round(reached / (leads + reached) * 100) : 0;

    return ui.sectionHead({
      kicker:'приём', title:'Воронка приёма',
      sub:'Каждый ребёнок проходит путь: заявка → диагностика → пробное → постоянные занятия. Перетащите карточку в следующий столбец или нажмите стрелку.',
      actions:'<button class="btn btn--primary" data-act="new-lead">' + ui.icon('inbox') + ' Новая заявка</button>'
    })
    + ui.hint('pipeline', 'Это ваша <b>воронка продаж</b>, только про детей. Она показывает, где теряются родители: если много карточек застряло в «Заявке» — им никто не перезвонил.')
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'inbox', color:'var(--c-blue)', label:'Новых заявок', value: byStage.lead.length + '',
          sub: byStage.lead.length ? 'ждут вашего звонка' : 'все разобраны' })
      + ui.kpi({ icon:'spark', color:'var(--c-pink)', label:'На пробном и диагностике',
          value:(byStage.diagnostic.length + byStage.trial.length) + '', sub:'решается, останутся ли' })
      + ui.kpi({ icon:'target', color:'var(--c-lime)', label:'Доходят до занятий', value: conv + '%',
          sub: reached + ' из ' + (leads + reached) + ' за всё время' })
      + ui.kpi({ icon:'medal', color:'var(--c-cyan)', label:'Выпустились', value: byStage.done.length + '',
          sub:'цель достигнута' })
    + '</div>'
    + '<div class="kanban">' + C.STAGES.map((stage, i) =>
      '<div class="kcol" data-col="' + stage.id + '" style="--kc:' + stage.color + '">'
      + '<div class="kcol__head"><span class="chip__dot" style="color:' + stage.color + '"></span>'
      + '<b>' + stage.name + '</b><span class="badge badge--soft">' + byStage[stage.id].length + '</span></div>'
      + '<div class="kcol__hint">' + u.esc(stage.hint) + '</div>'
      + byStage[stage.id].map(s => kcard(s, i)).join('')
      + (byStage[stage.id].length ? '' : '<div class="dim center" style="font-size:12px;padding:18px 6px">перетащите сюда</div>')
      + (stage.id === 'lead' ? '<button class="btn btn--sm btn--ghost btn--block" data-act="new-lead">'
          + ui.icon('plus') + ' Добавить заявку</button>' : '')
      + '</div>').join('') + '</div>';
  },

  mount(root){
    root.addEventListener('click', e => {
      const mv = e.target.closest('[data-move]');
      if (mv){
        const s = S.student(mv.dataset.sid);
        const i = C.STAGES.findIndex(x => x.id === s.stage);
        const next = C.STAGES[u.clamp(i + Number(mv.dataset.move), 0, C.STAGES.length - 1)];
        if (next.id !== s.stage){
          S.setStage(s.id, next.id);
          ui.toast(S.studentName(s.id), 'Теперь на этапе «' + next.name + '»', 'ok', 2200);
          LP.app.render();
        }
        return;
      }
      const op = e.target.closest('[data-open]');
      if (op) return LP.views.students.card(op.dataset.open);
      const b = e.target.closest('[data-act]');
      if (b && b.dataset.act === 'new-lead')
        LP.forms.student(null, { stage:'lead', after: s => { LP.app.render(); if (s) LP.views.students.card(s.id); } });
      const c = e.target.closest('.kcard');
      if (c && !e.target.closest('button,a')) LP.views.students.card(c.dataset.sid);
    });

    /* перетаскивание карточек между столбцами */
    let dragId = null;
    root.addEventListener('dragstart', e => {
      const c = e.target.closest('.kcard'); if (!c) return;
      dragId = c.dataset.sid;
      c.classList.add('is-drag');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', dragId); } catch(err){}
    });
    root.addEventListener('dragend', e => {
      const c = e.target.closest('.kcard'); if (c) c.classList.remove('is-drag');
      LP.$$('.kcol', root).forEach(k => k.classList.remove('is-over'));
    });
    root.addEventListener('dragover', e => {
      const col = e.target.closest('.kcol'); if (!col) return;
      e.preventDefault(); e.dataTransfer.dropEffect = 'move';
      LP.$$('.kcol', root).forEach(k => k.classList.toggle('is-over', k === col));
    });
    root.addEventListener('drop', e => {
      const col = e.target.closest('.kcol'); if (!col) return;
      e.preventDefault();
      const id = dragId || e.dataTransfer.getData('text/plain');
      const stage = col.dataset.col;
      if (id && S.student(id) && S.student(id).stage !== stage){
        S.setStage(id, stage);
        ui.toast(S.studentName(id), 'Теперь на этапе «' + (C.STAGES.find(x => x.id === stage)||{}).name + '»', 'ok', 2200);
      }
      dragId = null;
      LP.app.render();
    });
  }
};
})();
