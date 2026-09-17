/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Прогресс речи — работа над звуками
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;
const state = { studentId: '' };

function stageOf(n){ return C.SOUND_STAGES[u.clamp(n, 0, 5)]; }

function soundCard(x){
  const sg = stageOf(x.stage);
  return '<div class="sound" style="--sg:linear-gradient(140deg,' + sg.color + ',' + ui.shade(sg.color,-30) + ')">'
    + '<div class="sound__top">'
      + '<div class="sound__ch" style="background:linear-gradient(140deg,' + sg.color + ',' + ui.shade(sg.color,-30) + ');color:'
        + ui.readable(sg.color) + '">' + u.esc(x.sound) + '</div>'
      + '<div class="grow"><div class="sound__stage" style="color:' + sg.color + '">' + sg.name + '</div>'
      + '<div class="dim" style="font-size:11px">' + (x.updatedAt ? d.ago(x.updatedAt) : '') + '</div></div>'
    + '</div>'
    + '<div class="sound__steps" title="' + u.esc(sg.hint) + '">'
      + [1,2,3,4,5].map(n => '<i class="' + (x.stage >= n ? 'on' : '') + '"></i>').join('')
    + '</div>'
    + '<div class="sound__acts">'
      + '<button class="btn btn--xs" data-act="sound-down" data-id="' + x.id + '" data-tip="Шаг назад">' + ui.icon('down') + '</button>'
      + '<button class="btn btn--xs btn--good grow" data-act="sound-up" data-id="' + x.id + '" data-tip="' + u.esc(stageOf(x.stage+1).name) + '">'
        + ui.icon('up') + ' Дальше</button>'
      + '<button class="kmini" data-act="sound-del" data-id="' + x.id + '" data-tip="Убрать звук">' + ui.icon('trash') + '</button>'
    + '</div></div>';
}

function legend(){
  return '<div class="stage-legend">' + C.SOUND_STAGES.slice(1).map(s =>
    '<span data-tip="' + u.esc(s.hint) + '"><i style="background:' + s.color + '"></i>' + s.name + '</span>').join('') + '</div>';
}

function board(studentId, compact){
  const s = S.student(studentId);
  if (!s) return ui.empty({ icon:'users', title:'Выберите ученика', text:'Наверху выберите ребёнка — покажу его звуки.' });
  const arr = u.sortBy(S.soundsOf(studentId), x => -x.stage);
  const pct = S.stats(studentId).soundPct;
  const used = arr.map(x => x.sound);
  const free = C.SOUNDS.filter(ch => !used.includes(ch));

  return (compact ? '' : '')
    + '<div class="panel panel--flat" style="margin-bottom:16px">'
      + '<div class="spread" style="gap:16px;flex-wrap:wrap">'
        + '<div class="row" style="gap:14px">' + ui.ring(pct, 62)
          + '<div><span class="kicker">общая готовность речи</span>'
          + '<div style="font-family:var(--ff-d);font-size:19px">' + u.nplural(arr.length, ['звук в работе','звука в работе','звуков в работе']) + '</div>'
          + '<div class="dim" style="font-size:12.5px">в свободной речи: '
            + arr.filter(x => x.stage === 5).length + ' из ' + arr.length + '</div></div>'
        + '</div>'
        + '<div class="grow" style="min-width:200px">' + ui.bar(pct, pct >= 70 ? 'good' : pct >= 35 ? '' : 'warm') + '</div>'
      + '</div>'
      + '<div class="hr"></div>' + legend()
    + '</div>'
    + (arr.length ? '<div class="soundboard">' + arr.map(soundCard).join('') + '</div>'
        : ui.empty({ icon:'mic', title:'Звуки не добавлены',
            text:'Отметьте, над какими звуками вы работаете — платформа будет показывать динамику по этапам.' }))
    + (free.length ? '<div class="panel panel--flat" style="margin-top:16px">'
        + '<span class="kicker">добавить звук в работу</span>'
        + '<div class="pickers" style="margin-top:10px">' + free.map(ch =>
          '<button class="picker" data-act="sound-add" data-ch="' + ch + '" data-sid="' + studentId + '">' + ch + '</button>').join('')
        + '</div></div>' : '');
}

function feed(){
  const wins = [];
  S.db.sounds.forEach(x => (x.history||[]).forEach(h => wins.push({ date:h.date, stage:h.stage, sound:x.sound, sid:x.studentId })));
  return u.sortBy(wins, w => w.date, 'desc').slice(0, 12);
}

LP.views = LP.views || {};
LP.views.progress = {
  id:'progress', name:'Прогресс речи', icon:'wave', kicker:'динамика', title:'Прогресс речи',
  board,

  handle(act, btn, sidFallback){
    if (act === 'sound-add'){ S.addSound(btn.dataset.sid || sidFallback, btn.dataset.ch); ui.toast('Звук добавлен', 'Начали с этапа «Подготовка»', 'ok', 2000); }
    if (act === 'sound-up'){
      const x = S.db.sounds.find(s => s.id === btn.dataset.id);
      if (x){
        const before = x.stage;
        S.setSoundStage(x.id, x.stage + 1);
        if (before === 5) ui.toast('Это последний этап', 'Звук «' + x.sound + '» уже в свободной речи', '', 2400);
        else if (x.stage === 5) ui.toast('🎉 Звук закреплён!', x.sound + ' — в свободной речи', 'ok', 4200);
        else ui.toast('Этап: ' + stageOf(x.stage).name, S.studentName(x.studentId) + ' · звук ' + x.sound, 'ok', 2000);
      }
    }
    if (act === 'sound-down'){
      const x = S.db.sounds.find(s => s.id === btn.dataset.id);
      if (x) S.setSoundStage(x.id, x.stage - 1);
    }
    if (act === 'sound-del') S.delSound(btn.dataset.id);
  },

  render(){
    const cands = S.db.students.filter(s => !s.archived && s.stage !== 'lead');
    if (!state.studentId || !S.student(state.studentId)) state.studentId = (cands[0]||{}).id || '';
    const all = S.db.sounds;
    const ready = all.filter(x => x.stage === 5).length;

    return ui.sectionHead({
      kicker:'динамика', title:'Прогресс речи',
      sub:'Каждый звук проходит путь: подготовка → постановка → автоматизация → дифференциация → свободная речь. Отмечайте шаг — и вы всегда сможете показать родителю, что изменилось.',
      actions: cands.length ? '<button class="btn" data-act="report">' + ui.icon('print') + ' Отчёт родителю</button>' : ''
    })
    + ui.hint('progress', 'Кнопка <b>«Дальше»</b> двигает звук на следующий этап и записывает дату. Из этих отметок собирается история достижений — её удобно показывать родителям.')
    + '<div class="grid grid--kpi" style="margin-bottom:18px">'
      + ui.kpi({ icon:'mic', color:'var(--c-violet)', label:'Звуков в работе', value: all.length + '',
          sub:'у ' + u.nplural(u.uniq(all.map(x => x.studentId)).length, ['ученика','учеников','учеников']) })
      + ui.kpi({ icon:'medal', color:'var(--c-lime)', label:'Доведено до речи', value: ready + '',
          sub: all.length ? Math.round(ready / all.length * 100) + '% от всех звуков' : '—' })
      + ui.kpi({ icon:'bolt', color:'var(--c-amber)', label:'На автоматизации', value: all.filter(x => x.stage === 3).length + '',
          sub:'самый долгий этап' })
      + ui.kpi({ icon:'spark', color:'var(--c-cyan)', label:'Шагов за месяц',
          value: feed().filter(w => w.date >= d.add(d.today(), -30)).length + '', sub:'отмеченных продвижений' })
    + '</div>'
    + (!cands.length
      ? ui.empty({ icon:'mic', title:'Пока некому вести прогресс',
          text:'Добавьте ученика и переведите его хотя бы на этап «Диагностика» — здесь появится доска звуков.' })
      : '<div class="panel" style="margin-bottom:16px"><span class="kicker">чей прогресс смотрим</span>'
        + '<div class="pickers" style="margin-top:10px">' + cands.map(s =>
            '<button class="picker' + (s.id === state.studentId ? ' is-on' : '') + '" data-pick="' + s.id + '">'
            + (s.emoji || '') + ' ' + u.esc(S.studentName(s.id)) + '</button>').join('') + '</div></div>'
        + board(state.studentId)
        + '<div class="panel" style="margin-top:18px"><div class="panel__head"><div class="panel__icon">' + ui.icon('medal') + '</div>'
        + '<div><span class="kicker">лента достижений</span><h3>Последние продвижения</h3></div></div>'
        + (feed().length ? '<div class="list">' + feed().map(w =>
            '<div class="tile" style="cursor:default"><span class="chip" style="flex:none;color:' + stageOf(w.stage).color
            + ';border-color:' + stageOf(w.stage).color + '55">' + u.esc(w.sound) + '</span>'
            + '<div class="grow"><div class="tile__t" style="font-size:13.5px">' + u.esc(S.studentName(w.sid)) + '</div>'
            + '<div class="tile__s">' + stageOf(w.stage).name + ' · ' + d.ago(w.date) + '</div></div></div>').join('') + '</div>'
          : '<p class="dim" style="margin:0;font-size:13px">Пока нет отметок. Нажмите «Дальше» на любом звуке.</p>')
        + '</div>');
  },

  mount(root){
    root.addEventListener('click', e => {
      const p = e.target.closest('[data-pick]');
      if (p){ state.studentId = p.dataset.pick; return LP.app.render(); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'report') return LP.views.progress.report(state.studentId);
      if (b.dataset.act.startsWith('sound-')){
        LP.views.progress.handle(b.dataset.act, b, state.studentId);
        LP.app.render();
      }
    });
  },

  /* Печатный отчёт для родителей */
  report(studentId){
    const s = S.student(studentId);
    if (!s) return;
    const st = S.stats(studentId);
    const arr = u.sortBy(S.soundsOf(studentId), x => -x.stage);
    const last = u.sortBy(S.lessonsOf(studentId).filter(l => l.status === 'done'), l => l.date, 'desc').slice(0, 5);
    const body = '<div id="lpReport">'
      + '<div class="panel panel--flat"><div class="spread">'
      + '<div><span class="kicker">отчёт о динамике</span><h3 style="font-size:20px">' + u.esc(S.studentName(studentId)) + '</h3>'
      + '<div class="dim">' + (d.ageText(s.birth) || '') + ' · ' + u.esc(s.diagnosis || 'заключение не указано') + '</div></div>'
      + ui.ring(st.soundPct, 66) + '</div></div>'
      + '<div class="grid grid--3" style="margin:14px 0">'
        + ui.kpi({ icon:'check', label:'Занятий проведено', value: st.done + '', color:'var(--c-lime)' })
        + ui.kpi({ icon:'target', label:'Посещаемость', value:(st.attendance == null ? '—' : st.attendance + '%'), color:'var(--c-cyan)' })
        + ui.kpi({ icon:'medal', label:'Звуков в речи', value: arr.filter(x => x.stage === 5).length + ' из ' + arr.length, color:'var(--c-violet)' })
      + '</div>'
      + '<div class="panel panel--flat"><span class="kicker">по звукам</span><div class="list" style="margin-top:10px">'
      + (arr.length ? arr.map(x => '<div class="row"><span class="chip chip--lg" style="width:54px;justify-content:center">' + u.esc(x.sound) + '</span>'
          + '<span class="grow">' + ui.bar(x.stage / 5 * 100, x.stage === 5 ? 'good' : '') + '</span>'
          + '<span style="width:130px;font-size:12.5px;color:' + stageOf(x.stage).color + ';font-weight:700">' + stageOf(x.stage).name + '</span></div>').join('')
        : '<span class="dim">звуки не добавлены</span>') + '</div></div>'
      + (last.length ? '<div class="panel panel--flat" style="margin-top:14px"><span class="kicker">последние занятия</span>'
        + '<div class="list" style="margin-top:10px">' + last.map(l => '<div class="row" style="align-items:flex-start">'
        + '<span class="chip" style="flex:none">' + d.fmtShort(l.date) + '</span><div><b style="font-size:13.5px">' + u.esc(l.topic || 'занятие') + '</b>'
        + (l.homework ? '<div class="dim" style="font-size:12.5px">Домашнее: ' + u.esc(l.homework) + '</div>' : '') + '</div></div>').join('')
        + '</div></div>' : '')
      + '<p class="dim" style="margin-top:14px;font-size:12px">' + u.esc(S.db.settings.clinic || '') + ' · '
        + u.esc(S.db.settings.therapist || '') + ' · ' + d.fmtFull(d.today()) + '</p></div>';
    const h = ui.modal({ wide:true, icon:'print', kicker:'для родителей', title:'Отчёт о динамике', body,
      foot:'<button class="btn btn--ghost" data-close>Закрыть</button>'
         + '<button class="btn" data-copy-report>' + ui.icon('copy') + ' Скопировать текстом</button>'
         + '<button class="btn btn--primary" data-print>' + ui.icon('print') + ' Распечатать / PDF</button>' });
    h.el.addEventListener('click', e => {
      if (e.target.closest('[data-print]')) window.print();
      if (e.target.closest('[data-copy-report]')){
        const txt = 'Отчёт о динамике · ' + S.studentName(studentId) + '\n'
          + 'Занятий проведено: ' + st.done + ', посещаемость: ' + (st.attendance == null ? '—' : st.attendance + '%') + '\n'
          + arr.map(x => '• ' + x.sound + ' — ' + stageOf(x.stage).name).join('\n')
          + '\n' + (S.db.settings.therapist || '') + ', ' + d.fmtFull(d.today());
        ui.copy(txt);
      }
    });
  }
};
})();
