/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · Настройки — профиль, правила, тарифы, данные
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C, ui = LP.ui, S = LP.store;

function fld(label, html, hint){
  return '<label class="field"><span>' + label + '</span>' + html + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</label>';
}

LP.views = LP.views || {};
LP.views.settings = {
  id:'settings', name:'Настройки', icon:'gear', kicker:'кабинет', title:'Настройки',

  render(){
    const s = S.db.settings;
    const size = (() => { try { return Math.round(JSON.stringify(S.db).length / 1024); } catch(e){ return 0; } })();

    return ui.sectionHead({
      kicker:'кабинет', title:'Настройки',
      sub:'Здесь настраивается всё, что платформа считает за вас: цены, рабочие часы, правила списания и резервные копии.'
    })
    + '<div class="grid grid--2">'

      /* профиль */
      + '<div class="panel panel--accent-cyan"><div class="panel__head"><div class="panel__icon">' + ui.icon('users') + '</div>'
        + '<div><span class="kicker">кто вы</span><h3>Профиль</h3></div></div>'
        + '<div class="form-grid">'
        + fld('Ваше имя', '<input class="input" data-s="therapist" value="' + u.esc(s.therapist) + '" placeholder="Мадина Каримова">')
        + fld('Название кабинета', '<input class="input" data-s="clinic" value="' + u.esc(s.clinic) + '" placeholder="Кабинет «Речь+»">')
        + fld('Телефон', '<input class="input" data-s="phone" value="' + u.esc(s.phone) + '" placeholder="+998 …">')
        + fld('Валюта', '<input class="input" data-s="currency" value="' + u.esc(s.currency) + '" placeholder="сум">',
              'Как подписывать суммы: сум, ₽, $, KZT')
        + '</div></div>'

      /* деньги */
      + '<div class="panel panel--accent-lime"><div class="panel__head"><div class="panel__icon">' + ui.icon('wallet') + '</div>'
        + '<div><span class="kicker">правила</span><h3>Деньги</h3></div></div>'
        + '<div class="form-grid">'
        + fld('Цена занятия по умолчанию', '<input class="input mono" type="number" min="0" step="1000" data-s="price" value="' + s.price + '">',
              'Подставляется новым ученикам без тарифа')
        + fld('Считать должником при балансе ниже', '<input class="input mono" type="number" step="1000" data-s="debtLimit" value="' + (s.debtLimit||0) + '">',
              '0 — любой минус это долг')
        + '</div>'
        + '<label class="switch" style="margin-top:12px"><input type="checkbox" data-s="chargeMissed"' + (s.chargeMissed ? ' checked' : '') + '>'
        + '<span class="switch__track"></span><span><b>Списывать деньги за пропуск</b>'
        + '<div class="hint">Если ребёнок не пришёл и не предупредил — занятие считается платным. «Отмена заранее» не списывается никогда.</div></span></label>'
        + '</div>'

      /* расписание */
      + '<div class="panel panel--accent-violet"><div class="panel__head"><div class="panel__icon">' + ui.icon('calendar') + '</div>'
        + '<div><span class="kicker">время</span><h3>Рабочий день</h3></div></div>'
        + '<div class="form-grid">'
        + fld('Начало дня', '<input class="input" type="time" data-s="dayStart" value="' + s.dayStart + '">')
        + fld('Конец дня', '<input class="input" type="time" data-s="dayEnd" value="' + s.dayEnd + '">')
        + fld('Длительность занятия, мин', '<input class="input mono" type="number" min="15" max="120" step="5" data-s="duration" value="' + s.duration + '">')
        + fld('Шаг сетки расписания, мин', '<select class="select" data-s="slot">'
            + [30,60].map(v => '<option value="' + v + '"' + (s.slot == v ? ' selected' : '') + '>' + v + ' минут</option>').join('') + '</select>')
        + '</div>'
        + '<div class="field" style="margin-top:12px"><span>Рабочие дни</span><div class="pickers" data-days>'
        + C.WD.map((w, i) => '<button class="picker' + ((s.workDays||[]).includes(i) ? ' is-on' : '') + '" data-day="' + i + '">'
            + C.WDS[i] + '</button>').join('') + '</div>'
        + '<span class="hint">Нерабочие дни в расписании подсвечиваются серым — но записать на них всё равно можно.</span></div>'
        + '</div>'

      /* тарифы */
      + '<div class="panel panel--accent-amber"><div class="panel__head"><div class="panel__icon">' + ui.icon('money') + '</div>'
        + '<div><span class="kicker">прайс</span><h3>Тарифы и абонементы</h3></div>'
        + '<button class="btn btn--xs" data-act="add-tariff">' + ui.icon('plus') + ' Добавить</button></div>'
        + (S.db.tariffs.length
          ? '<div class="list">' + S.db.tariffs.map(t =>
            '<div class="tile" style="cursor:default;gap:10px">'
            + '<input class="input" data-t="' + t.id + '" data-k="name" value="' + u.esc(t.name) + '" style="flex:2;min-height:38px">'
            + '<input class="input mono" type="number" data-t="' + t.id + '" data-k="price" value="' + t.price + '" style="width:120px;min-height:38px" title="Цена">'
            + '<input class="input mono" type="number" data-t="' + t.id + '" data-k="lessons" value="' + t.lessons + '" style="width:74px;min-height:38px" title="Занятий в пакете">'
            + '<button class="kmini" data-act="del-tariff" data-id="' + t.id + '">' + ui.icon('trash') + '</button></div>').join('') + '</div>'
            + '<p class="hint" style="margin-top:10px">Поля слева направо: название · стоимость пакета · сколько занятий входит. '
            + 'Цена одного занятия считается автоматически.</p>'
          : '<p class="dim" style="font-size:13px">Тарифов нет — используется цена по умолчанию.</p>')
        + '</div>'
    + '</div>'

    /* данные */
    + '<div class="panel panel--accent-red" style="margin-top:18px">'
      + '<div class="panel__head"><div class="panel__icon">' + ui.icon('shield') + '</div>'
      + '<div><span class="kicker">важно</span><h3>Ваши данные</h3></div></div>'
      + '<div class="hintbar" style="margin-bottom:14px">' + ui.icon('info')
        + '<div>Платформа работает <b>полностью в вашем браузере</b> — данные не уходят в интернет и никому не видны. '
        + 'Обратная сторона: если очистить историю браузера или сменить устройство, данные пропадут. '
        + 'Поэтому <b>раз в неделю делайте резервную копию</b> — это один файл.</div></div>'
      + '<div class="row row--wrap">'
        + '<button class="btn btn--primary" data-act="backup">' + ui.icon('download') + ' Скачать резервную копию</button>'
        + '<button class="btn" data-act="restore">' + ui.icon('upload') + ' Восстановить из файла</button>'
        + '<button class="btn" data-act="demo">' + ui.icon('spark') + ' Загрузить демо-кабинет</button>'
        + '<button class="btn btn--danger" data-act="wipe">' + ui.icon('trash') + ' Очистить всё</button>'
      + '</div>'
      + '<div class="hr"></div>'
      + '<div class="row row--wrap" style="gap:18px;font-size:12.5px">'
        + '<span class="dim">Объём данных: <b>' + size + ' КБ</b></span>'
        + '<span class="dim">Учеников: <b>' + S.db.students.length + '</b></span>'
        + '<span class="dim">Занятий: <b>' + S.db.lessons.length + '</b></span>'
        + '<span class="dim">Оплат: <b>' + S.db.payments.length + '</b></span>'
      + '</div>'
      + '<input type="file" accept="application/json,.json" id="lpRestore" hidden>'
    + '</div>'

    /* журнал действий */
    + (S.db.log.length ? '<div class="panel" style="margin-top:18px">'
      + '<div class="panel__head"><div class="panel__icon">' + ui.icon('list') + '</div>'
      + '<div><span class="kicker">последние действия</span><h3>Что происходило</h3></div></div>'
      + '<div class="list">' + S.db.log.slice(0, 10).map(l =>
        '<div class="tile" style="cursor:default;padding:9px 12px">'
        + '<span class="chip" style="flex:none">' + new Date(l.at).toLocaleDateString('ru-RU') + '</span>'
        + '<span class="grow" style="font-size:13px">' + u.esc(l.text) + '</span></div>').join('') + '</div></div>' : '');
  },

  mount(root){
    const save = (k, v) => {
      S.db.settings[k] = v;
      S.emit('settings');
    };
    root.addEventListener('change', e => {
      const f = e.target.closest('[data-s]');
      if (f){
        const k = f.dataset.s;
        const v = f.type === 'checkbox' ? f.checked : (f.type === 'number' ? Number(f.value) : f.value);
        save(k, v);
        ui.toast('Сохранено', '', 'ok', 1400);
        if (['currency','price','slot','dayStart','dayEnd'].includes(k)) LP.app.render();
      }
      const t = e.target.closest('[data-t]');
      if (t){
        const patch = {};
        patch[t.dataset.k] = t.type === 'number' ? Number(t.value) : t.value;
        S.updTariff(t.dataset.t, patch);
        ui.toast('Тариф обновлён', '', 'ok', 1400);
      }
    });
    root.addEventListener('click', async e => {
      const day = e.target.closest('[data-day]');
      if (day){
        const i = Number(day.dataset.day);
        const arr = new Set(S.db.settings.workDays || []);
        if (arr.has(i)) arr.delete(i); else arr.add(i);
        save('workDays', Array.from(arr).sort());
        day.classList.toggle('is-on');
        return;
      }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const act = b.dataset.act;
      if (act === 'add-tariff'){ S.addTariff({ name:'Абонемент', price: S.db.settings.price * 8, lessons: 8 }); LP.app.render(); }
      if (act === 'del-tariff'){ S.delTariff(b.dataset.id); LP.app.render(); }
      if (act === 'backup'){
        ui.download('logopulse-backup-' + d.today() + '.json', S.exportJSON());
        ui.toast('Копия сохранена', 'Файл в папке «Загрузки». Храните его в облаке.', 'ok', 5000);
      }
      if (act === 'restore') LP.$('#lpRestore', root).click();
      if (act === 'demo'){
        const ok = await ui.confirm({ danger:true, title:'Загрузить демо-кабинет?',
          html:'Текущие данные будут <b>полностью заменены</b> вымышленным примером с 13 детьми. Сначала сделайте резервную копию.',
          ok:'Да, загрузить пример' });
        if (ok){ S.reset(true); LP.app.render(); ui.toast('Демо-кабинет загружен', 'Можно всё трогать — это выдуманные дети', 'ok'); }
      }
      if (act === 'wipe'){
        const ok = await ui.confirm({ danger:true, title:'Удалить все данные?',
          html:'Исчезнут <b>все ученики, занятия, оплаты и прогресс</b>. Восстановить можно будет только из резервной копии.',
          ok:'Да, очистить' });
        if (ok){ S.reset(false); LP.app.render(); ui.toast('Данные очищены', 'Кабинет пуст', 'warn'); }
      }
    });
    const file = LP.$('#lpRestore', root);
    if (file) file.addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          S.importJSON(r.result);
          LP.app.render();
          ui.toast('Данные восстановлены', 'Учеников: ' + S.db.students.length, 'ok', 4000);
        } catch(err){
          ui.toast('Не получилось', err.message || 'Файл повреждён', 'err', 5000);
        }
      };
      r.readAsText(f);
    });
  }
};
})();
