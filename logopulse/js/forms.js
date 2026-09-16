/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · forms.js — окна создания и редактирования
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;

/* собрать значения всех полей с атрибутом data-f */
function read(scope){
  const o = {};
  LP.$$('[data-f]', scope).forEach(el => {
    const k = el.getAttribute('data-f');
    if (el.type === 'checkbox') o[k] = el.checked;
    else if (el.type === 'number') o[k] = el.value === '' ? null : Number(el.value);
    else o[k] = el.value;
  });
  return o;
}
function invalid(scope, name, msg){
  const el = LP.$('[data-f="' + name + '"]', scope);
  if (el){ el.focus(); el.style.borderColor = 'var(--c-red)'; setTimeout(() => el.style.borderColor = '', 1600); }
  ui.toast('Заполните поле', msg, 'warn');
}
function field(label, html, hint){
  return '<label class="field"><span>' + label + '</span>' + html + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</label>';
}
function opts(list, sel, val, name){
  return list.map(x => {
    const v = val ? val(x) : x, n = name ? name(x) : x;
    return '<option value="' + u.esc(v) + '"' + (String(v) === String(sel) ? ' selected' : '') + '>' + u.esc(n) + '</option>';
  }).join('');
}

const F = {
  read, field,

  /* ═══ Ученик ═══ */
  student(id, opt){
    opt = opt || {};
    const st = id ? S.student(id) : null;
    const isNew = !st;
    const v = st || { stage: opt.stage || 'lead', color: C.PALETTE[S.db.students.length % 8],
                      emoji: C.EMOJI[S.db.students.length % C.EMOJI.length], since: d.today() };
    const body =
      '<div class="form-grid">'
      + field('Имя ребёнка *', '<input class="input" data-f="first" value="' + u.esc(v.first||'') + '" placeholder="Амина" autofocus>')
      + field('Фамилия', '<input class="input" data-f="last" value="' + u.esc(v.last||'') + '" placeholder="Рахимова">')
      + field('Дата рождения', '<input class="input" type="date" data-f="birth" value="' + u.esc(v.birth||'') + '">', 'Возраст посчитается сам')
      + field('Этап работы', '<select class="select" data-f="stage">' + opts(C.STAGES, v.stage, x => x.id, x => x.name) + '</select>')
      + '</div><div class="hr"></div>'
      + '<span class="kicker">Родитель и связь</span><div class="form-grid" style="margin-top:10px">'
      + field('Кто приводит (ФИО)', '<input class="input" data-f="parent" value="' + u.esc(v.parent||'') + '" placeholder="Дилноза Рахимова">')
      + field('Телефон', '<input class="input" type="tel" data-f="phone" value="' + u.esc(v.phone||'') + '" placeholder="+998 90 123-45-67">')
      + field('Мессенджер / соцсеть', '<input class="input" data-f="messenger" value="' + u.esc(v.messenger||'') + '" placeholder="@username">')
      + field('Откуда узнали', '<select class="select" data-f="source"><option value="">—</option>' + opts(C.SOURCES, v.source||'') + '</select>')
      + '</div><div class="hr"></div>'
      + '<span class="kicker">Речь и цели</span><div class="form-grid" style="margin-top:10px">'
      + field('Логопедическое заключение', '<input class="input" data-f="diagnosis" value="' + u.esc(v.diagnosis||'') + '" placeholder="Дислалия: нарушены Р, Рь">')
      + field('Цель работы', '<input class="input" data-f="goal" value="' + u.esc(v.goal||'') + '" placeholder="Чистая речь к школе">')
      + '<div class="field span-2"><span>Жалоба родителя (своими словами)</span>'
      + '<textarea class="textarea" data-f="complaint" placeholder="Не выговаривает «Р», стесняется отвечать в саду…">' + u.esc(v.complaint||'') + '</textarea></div>'
      + '</div><div class="hr"></div>'
      + '<span class="kicker">Оплата</span><div class="form-grid" style="margin-top:10px">'
      + field('Тариф', '<select class="select" data-f="tariffId"><option value="">По умолчанию</option>'
          + opts(S.db.tariffs, v.tariffId||'', x => x.id, x => x.name + ' — ' + u.money(x.price)) + '</select>')
      + field('Своя цена за занятие', '<input class="input" type="number" min="0" step="1000" data-f="price" value="'
          + (v.price != null && v.price !== '' ? v.price : '') + '" placeholder="' + S.db.settings.price + '">',
          'Оставьте пустым — возьмётся из тарифа')
      + field('Занимается с', '<input class="input" type="date" data-f="since" value="' + u.esc(v.since || d.today()) + '">')
      + '</div><div class="hr"></div>'
      + '<span class="kicker">Оформление карточки</span>'
      + '<div class="row row--wrap" style="margin-top:10px;gap:18px;align-items:flex-start">'
      + '<div><div class="label" style="margin-bottom:6px">Значок</div><div class="pickers" data-emoji>'
        + C.EMOJI.map(e => '<button type="button" class="picker picker--emoji' + (e === v.emoji ? ' is-on' : '') + '" data-val="' + e + '">' + e + '</button>').join('')
      + '</div></div>'
      + '<div><div class="label" style="margin-bottom:6px">Цвет</div><div class="pickers" data-color>'
        + C.PALETTE.map(c => '<button type="button" class="picker picker--color' + (c === v.color ? ' is-on' : '') + '" data-val="' + c + '" style="background:' + c + '" aria-label="' + c + '"></button>').join('')
      + '</div></div></div>'
      + '<div class="field" style="margin-top:14px"><span>Заметки для себя</span>'
      + '<textarea class="textarea" data-f="notes" placeholder="Любит динозавров · Мама просит писать в телеграм · Приводит бабушка по средам">' + u.esc(v.notes||'') + '</textarea></div>';

    const h = ui.modal({
      wide: true, icon: 'users',
      kicker: isNew ? 'новая карточка' : 'редактирование',
      title: isNew ? 'Новый ученик' : S.studentName(id),
      body,
      foot: (isNew ? '' : '<button class="btn btn--danger left" data-del>' + ui.icon('trash') + ' Удалить</button>')
          + '<button class="btn btn--ghost" data-close>Отмена</button>'
          + '<button class="btn btn--primary" data-save>' + ui.icon('check') + ' Сохранить</button>'
    });

    let emoji = v.emoji, color = v.color;
    h.el.addEventListener('click', async e => {
      const em = e.target.closest('[data-emoji] .picker');
      if (em){ emoji = em.dataset.val; LP.$$('[data-emoji] .picker', h.el).forEach(b => b.classList.toggle('is-on', b === em)); }
      const co = e.target.closest('[data-color] .picker');
      if (co){ color = co.dataset.val; LP.$$('[data-color] .picker', h.el).forEach(b => b.classList.toggle('is-on', b === co)); }
      if (e.target.closest('[data-del]')){
        const ok = await ui.confirm({ danger: true, title: 'Удалить ученика?',
          html: 'Вместе с карточкой <b>' + u.esc(S.studentName(id)) + '</b> удалятся все его занятия, оплаты и прогресс по звукам. Отменить будет нельзя.',
          ok: 'Удалить навсегда' });
        if (ok){ S.delStudent(id); h.close(); ui.toast('Карточка удалена', '', 'ok'); opt.after && opt.after(null); }
      }
      if (e.target.closest('[data-save]')){
        const data = read(h.el);
        if (!data.first || !data.first.trim()) return invalid(h.el, 'first', 'Без имени карточку не сохранить');
        data.emoji = emoji; data.color = color;
        if (isNew){
          const ns = S.addStudent(data);
          ui.toast('Ученик добавлен', S.studentName(ns.id), 'ok');
          h.close(); opt.after && opt.after(ns);
        } else {
          S.updStudent(id, data);
          ui.toast('Сохранено', S.studentName(id), 'ok');
          h.close(); opt.after && opt.after(S.student(id));
        }
      }
    });
    return h;
  },

  /* ═══ Занятие ═══ */
  lesson(idOrPrefill, opt){
    opt = opt || {};
    const isEdit = typeof idOrPrefill === 'string';
    const ls = isEdit ? S.lesson(idOrPrefill) : null;
    const pre = isEdit ? ls : Object.assign({
      studentId: (S.activeStudents()[0]||{}).id || (S.db.students[0]||{}).id || '',
      date: d.today(), start: '10:00', dur: S.db.settings.duration, status: 'planned'
    }, idOrPrefill || {});
    if (isEdit && !ls) return;
    const price = pre.price != null ? pre.price : S.priceFor(S.student(pre.studentId));

    const body =
      (S.db.students.length ? '' : '<div class="hintbar">' + ui.icon('warn') + '<div>Сначала добавьте хотя бы одного ученика.</div></div>')
      + '<div class="form-grid">'
      + field('Ученик *', ui.selectStudents(pre.studentId, { attrs: 'data-f="studentId"' }))
      + field('Дата', '<input class="input" type="date" data-f="date" value="' + u.esc(pre.date) + '">')
      + field('Начало', '<input class="input" type="time" data-f="start" value="' + u.esc(pre.start) + '" step="300">')
      + field('Длительность, мин', '<input class="input" type="number" min="10" max="180" step="5" data-f="dur" value="' + (pre.dur||45) + '">')
      + field('Статус', '<select class="select" data-f="status">'
          + Object.keys(C.LESSON).map(k => '<option value="' + k + '"' + (k === pre.status ? ' selected' : '') + '>' + C.LESSON[k].name + '</option>').join('')
          + '</select>')
      + field('Стоимость', '<input class="input" type="number" min="0" step="1000" data-f="price" value="' + price + '">',
              'Списывается с баланса, когда занятие проведено')
      + '</div>'
      + '<div class="pill-note" id="lsNote" style="margin-top:12px"></div><div class="hr"></div>'
      + '<div class="form-grid">'
      + '<div class="field span-2"><span>Тема занятия</span><input class="input" data-f="topic" value="' + u.esc(pre.topic||'')
        + '" placeholder="Автоматизация Р в словах" list="lp-topics">'
        + '<datalist id="lp-topics">' + ['Артикуляционная гимнастика','Постановка звука','Автоматизация в слогах','Автоматизация в словах',
          'Автоматизация во фразе','Дифференциация звуков','Фонематический слух','Слоговая структура слова','Лексика и грамматика',
          'Связная речь: пересказ','Подготовка к обучению грамоте','Дыхательные упражнения'].map(t => '<option value="' + t + '">').join('') + '</datalist></div>'
      + '<div class="field span-2"><span>Что делали на занятии</span><textarea class="textarea" data-f="notes" placeholder="Коротко: что получилось, что трудно, чем закончили">' + u.esc(pre.notes||'') + '</textarea></div>'
      + '<div class="field span-2"><span>Домашнее задание</span><textarea class="textarea" data-f="homework" placeholder="Повторять слоги ра-ро-ру 3 раза в день">' + u.esc(pre.homework||'') + '</textarea></div>'
      + '</div>'
      + '<div class="field" style="margin-top:8px"><span>Как прошло занятие</span><div class="pickers" data-score>'
        + [1,2,3,4,5].map(n => '<button type="button" class="picker' + (n === (pre.score||0) ? ' is-on' : '') + '" data-val="' + n + '">'
            + ['😕 Трудно','🙂 Нормально','😃 Хорошо','🔥 Отлично','🏆 Прорыв'][n-1] + '</button>').join('')
      + '</div></div>'
      + (isEdit ? '' :
        '<div class="fieldset" style="margin-top:16px"><span class="kicker">Повторять каждую неделю</span>'
        + '<div class="pickers" data-rep>' + C.WD.map((w,i) => '<button type="button" class="picker" data-val="' + i + '">' + C.WDS[i] + '</button>').join('') + '</div>'
        + '<div class="row" style="margin-top:12px">'
        + '<span class="hint">Выберите дни — и занятие создастся на несколько недель вперёд</span>'
        + '<label class="field" style="margin-left:auto;width:120px"><span>Недель</span>'
        + '<input class="input" type="number" min="1" max="24" value="4" data-weeks></label></div></div>');

    const h = ui.modal({
      wide: true, icon: 'calendar',
      kicker: isEdit ? 'занятие' : 'новое занятие',
      title: isEdit ? (S.studentName(ls.studentId) + ' · ' + d.fmt(ls.date)) : 'Записать на занятие',
      body,
      foot: (isEdit ? '<button class="btn btn--danger left" data-del>' + ui.icon('trash') + ' Удалить</button>' : '')
          + '<button class="btn btn--ghost" data-close>Отмена</button>'
          + '<button class="btn btn--primary" data-save>' + ui.icon('check') + ' ' + (isEdit ? 'Сохранить' : 'Записать') + '</button>'
    });

    let score = pre.score || 0;
    const reps = new Set();

    /* подсказка: свободно ли время и что с балансом */
    const note = LP.$('#lsNote', h.el);
    const refresh = () => {
      const v = read(h.el);
      const busy = S.overlaps(v.date, v.start, v.dur, isEdit ? idOrPrefill : null);
      const st = S.student(v.studentId);
      const bal = st ? S.balance(st.id) : 0;
      note.innerHTML = (busy.length
        ? '<span style="color:var(--c-amber)"><b>⚠ Это время уже занято:</b> '
          + busy.map(l => u.esc(S.studentName(l.studentId)) + ' (' + l.start + '–' + d.endTime(l.start, l.dur) + ')').join(', ')
          + '. Записать всё равно можно — например, если занятие групповое.</span>'
        : '<span style="color:var(--c-lime)">✓ ' + d.fmtWd(v.date) + ', ' + v.start + ' — время свободно</span>')
        + (st ? '<br><span class="dim">Баланс ' + u.esc(st.first) + ': ' + u.money(bal)
            + (bal < 0 ? ' — есть долг' : bal > 0 ? ' — оплачено вперёд' : '') + '</span>' : '');
    };
    refresh();
    h.el.addEventListener('input', refresh);
    h.el.addEventListener('change', refresh);
    h.el.addEventListener('click', async e => {
      const sc = e.target.closest('[data-score] .picker');
      if (sc){
        score = Number(sc.dataset.val);
        LP.$$('[data-score] .picker', h.el).forEach(b => b.classList.toggle('is-on', b === sc));
      }
      const rp = e.target.closest('[data-rep] .picker');
      if (rp){
        const val = Number(rp.dataset.val);
        if (reps.has(val)) reps.delete(val); else reps.add(val);
        rp.classList.toggle('is-on');
      }
      if (e.target.closest('[data-del]')){
        const ok = await ui.confirm({ danger: true, title: 'Удалить занятие?', text: 'Запись исчезнет из расписания и журнала.', ok: 'Удалить' });
        if (ok){ S.delLesson(idOrPrefill); h.close(); ui.toast('Занятие удалено', '', 'ok'); opt.after && opt.after(); }
      }
      if (e.target.closest('[data-save]')){
        const data = read(h.el);
        if (!data.studentId) return invalid(h.el, 'studentId', 'Выберите ученика');
        data.score = score;
        if (isEdit){
          S.updLesson(idOrPrefill, data);
          ui.toast('Занятие обновлено', '', 'ok');
        } else if (reps.size){
          const weeks = Number(LP.$('[data-weeks]', h.el).value) || 4;
          const list = S.addSeries(data, Array.from(reps).sort(), weeks);
          ui.toast('Создано занятий: ' + list.length, 'Повтор на ' + u.nplural(weeks, ['неделю','недели','недель']), 'ok');
        } else {
          S.addLesson(data);
          ui.toast('Записано', S.studentName(data.studentId) + ' · ' + d.human(data.date) + ' в ' + data.start, 'ok');
        }
        h.close(); opt.after && opt.after();
      }
    });
    return h;
  },

  /* ═══ Оплата ═══ */
  payment(prefill, opt){
    opt = opt || {};
    const pre = Object.assign({ studentId: '', date: d.today(), method: 'cash', amount: '' }, prefill || {});
    const quick = S.db.tariffs.slice(0, 4);
    const body =
      '<div class="form-grid">'
      + field('От кого *', ui.selectStudents(pre.studentId, { attrs: 'data-f="studentId"', any: '— выберите ученика —' }))
      + field('Сумма *', '<input class="input mono" type="number" min="0" step="1000" data-f="amount" value="' + (pre.amount||'') + '" placeholder="0" autofocus>')
      + field('Дата', '<input class="input" type="date" data-f="date" value="' + pre.date + '">')
      + field('Способ', '<select class="select" data-f="method">'
          + Object.keys(C.PAY).map(k => '<option value="' + k + '"' + (k === pre.method ? ' selected' : '') + '>' + C.PAY[k].name + '</option>').join('')
          + '</select>')
      + '</div>'
      + (quick.length ? '<div class="field" style="margin-top:14px"><span>Быстрый выбор по тарифу</span><div class="pickers" data-quick>'
          + quick.map(t => '<button type="button" class="picker" data-val="' + t.price + '" data-n="' + t.lessons + '">'
            + u.esc(t.name) + ' · ' + u.money(t.price) + '</button>').join('') + '</div></div>' : '')
      + '<div class="field" style="margin-top:14px"><span>Комментарий</span>'
      + '<input class="input" data-f="comment" placeholder="Например: за сентябрь, наличными при встрече"></div>'
      + '<div class="pill-note" id="payHint" style="margin-top:14px"></div>';

    const h = ui.modal({
      icon: 'wallet', kicker: 'деньги', title: 'Записать оплату', body,
      foot: '<button class="btn btn--ghost" data-close>Отмена</button>'
          + '<button class="btn btn--good" data-save>' + ui.icon('check') + ' Записать оплату</button>'
    });

    const hint = LP.$('#payHint', h.el);
    const refresh = () => {
      const v = read(h.el);
      const st = S.student(v.studentId);
      if (!st){ hint.innerHTML = 'Выберите ученика — покажу его текущий баланс.'; return; }
      const bal = S.balance(st.id), price = S.priceFor(st) || 1;
      const after = bal + (Number(v.amount) || 0);
      hint.innerHTML = 'Баланс сейчас: ' + ui.moneyHtml(bal) + ' · после оплаты: ' + ui.moneyHtml(after)
        + '<br><span class="dim">Это ' + u.nplural(Math.floor(Math.max(0, after) / price), ['оплаченное занятие','оплаченных занятия','оплаченных занятий']) + ' вперёд.</span>';
    };
    refresh();
    h.el.addEventListener('input', refresh);
    h.el.addEventListener('change', refresh);
    h.el.addEventListener('click', e => {
      const q = e.target.closest('[data-quick] .picker');
      if (q){
        LP.$('[data-f="amount"]', h.el).value = q.dataset.val;
        LP.$$('[data-quick] .picker', h.el).forEach(b => b.classList.toggle('is-on', b === q));
        refresh();
      }
      if (e.target.closest('[data-save]')){
        const v = read(h.el);
        if (!v.studentId) return invalid(h.el, 'studentId', 'Укажите, от кого оплата');
        if (!v.amount || v.amount <= 0) return invalid(h.el, 'amount', 'Сумма должна быть больше нуля');
        const price = S.priceFor(S.student(v.studentId)) || 1;
        v.forLessons = Math.round(v.amount / price);
        S.addPayment(v);
        ui.toast('Оплата записана', u.money(v.amount) + ' · ' + S.studentName(v.studentId), 'ok');
        h.close(); opt.after && opt.after();
      }
    });
    return h;
  },

  /* ═══ Задача-напоминание ═══ */
  task(opt){
    opt = opt || {};
    const body = '<div class="form-grid">'
      + '<div class="field span-2"><span>Что нужно сделать *</span>'
      + '<input class="input" data-f="title" placeholder="Позвонить маме Марка" autofocus></div>'
      + field('Когда', '<input class="input" type="date" data-f="date" value="' + d.today() + '">')
      + field('Связано с учеником', ui.selectStudents('', { attrs: 'data-f="studentId"', any: '— не важно —' }))
      + '</div>';
    const h = ui.modal({ icon:'flag', slim:true, kicker:'напоминание', title:'Новая задача', body,
      foot: '<button class="btn btn--ghost" data-close>Отмена</button><button class="btn btn--primary" data-save>Добавить</button>' });
    h.el.addEventListener('click', e => {
      if (e.target.closest('[data-save]')){
        const v = read(h.el);
        if (!v.title || !v.title.trim()) return invalid(h.el, 'title', 'Опишите задачу');
        S.addTask(v); ui.toast('Задача добавлена', '', 'ok'); h.close(); opt.after && opt.after();
      }
    });
    return h;
  },

  /* ═══ Быстрое меню «Создать» ═══ */
  quick(){
    /* что бы ни создали — экран обновляется сразу */
    const redraw = () => LP.app && LP.app.render();
    const items = [
      { ic:'users',    t:'Ученик',   s:'Новая карточка ребёнка', go:() => F.student(null, { after: st => {
            redraw(); if (st) LP.views.students.card(st.id); } }) },
      { ic:'calendar', t:'Занятие',  s:'Запись в расписание',    go:() => F.lesson({}, { after: redraw }) },
      { ic:'wallet',   t:'Оплата',   s:'Зафиксировать деньги',   go:() => F.payment({}, { after: redraw }) },
      { ic:'flag',     t:'Задача',   s:'Напоминание себе',       go:() => F.task({ after: redraw }) }
    ];
    const h = ui.modal({
      slim: true, icon:'spark', kicker:'быстрое действие', title:'Что создаём?', foot: null,
      body: '<div class="list">' + items.map((x,i) =>
        '<button class="tile" data-i="' + i + '"><div class="panel__icon">' + ui.icon(x.ic) + '</div>'
        + '<div><div class="tile__t">' + x.t + '</div><div class="tile__s">' + x.s + '</div></div>'
        + '<span class="tile__end dim">' + ui.icon('right') + '</span></button>').join('') + '</div>'
    });
    h.el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b){ h.close(); items[Number(b.dataset.i)].go(); }
    });
  }
};
LP.forms = F;
})();
