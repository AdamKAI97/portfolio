/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · store.js — данные, расчёты, сохранение
   Всё хранится локально (localStorage). Сервер не нужен.
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u, d = LP.d, C = LP.C;
const KEY = 'logopulse.db.v1';

const DEFAULTS = () => ({
  version: 1,
  settings: {
    therapist: 'Логопед',
    clinic: 'Мой логопедический кабинет',
    phone: '',
    currency: 'сум',
    price: 120000,          // цена одного занятия по умолчанию
    duration: 45,           // длительность, минут
    workDays: [0,1,2,3,4,5],// 0 = понедельник
    dayStart: '09:00',
    dayEnd: '19:00',
    slot: 60,               // шаг сетки расписания, минут
    chargeMissed: true,     // списывать деньги за пропуск без предупреждения
    debtLimit: 0,           // при каком балансе считать должником
    theme: 'dark',
    hints: {},              // скрытые подсказки
    onboarded: false
  },
  students: [], lessons: [], payments: [], sounds: [], tariffs: [], tasks: [],
  log: []
});

const S = {
  db: DEFAULTS(),
  _subs: [],
  _timer: null,

  /* ───── жизненный цикл ───── */
  load(){
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        S.db = Object.assign(DEFAULTS(), parsed);
        S.db.settings = Object.assign(DEFAULTS().settings, parsed.settings || {});
        return true;
      }
    } catch(e){ console.warn('Не удалось прочитать данные:', e); }
    return false;
  },
  save(){
    clearTimeout(S._timer);
    S._timer = setTimeout(S.flush, 90);
  },
  /* немедленная запись — вызывается при закрытии вкладки */
  flush(){
    clearTimeout(S._timer); S._timer = null;
    try { localStorage.setItem(KEY, JSON.stringify(S.db)); }
    catch(e){ LP.ui && LP.ui.toast('Не удалось сохранить', 'Хранилище браузера переполнено или недоступно', 'err', 6000); }
  },
  on(fn){ S._subs.push(fn); },
  emit(what){ S.save(); S._subs.forEach(f => { try { f(what); } catch(e){ console.error(e); } }); },
  reset(seed){
    S.db = DEFAULTS();
    if (seed) S.seed();
    S.emit('reset');
  },
  exportJSON(){ return JSON.stringify(S.db, null, 2); },
  importJSON(text){
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.students))
      throw new Error('Файл не похож на резервную копию ЛогоПульса');
    S.db = Object.assign(DEFAULTS(), parsed);
    S.db.settings = Object.assign(DEFAULTS().settings, parsed.settings || {});
    S.emit('import');
    return true;
  },

  /* ───── журнал действий ───── */
  logAdd(text, kind){
    S.db.log.unshift({ id:u.uid('l'), text, kind: kind||'info', at: new Date().toISOString() });
    if (S.db.log.length > 200) S.db.log.length = 200;
  },

  /* ───── ученики ───── */
  student(id){ return S.db.students.find(s => s.id === id) || null; },
  studentName(id){ const s = S.student(id); return s ? (s.first + ' ' + (s.last||'')).trim() : 'Ученик удалён'; },
  addStudent(data){
    const st = Object.assign({
      id: u.uid('st'), first:'', last:'', birth:'', gender:'',
      parent:'', phone:'', messenger:'', source:'', stage:'lead',
      diagnosis:'', complaint:'', goal:'', tariffId:'', price:null,
      color: C.PALETTE[S.db.students.length % C.PALETTE.length],
      emoji: C.EMOJI[S.db.students.length % C.EMOJI.length],
      notes:'', createdAt: new Date().toISOString(), since: d.today(), archived:false
    }, data||{});
    S.db.students.push(st);
    S.logAdd('Добавлен ученик: ' + (st.first + ' ' + st.last).trim(), 'student');
    S.emit('students');
    return st;
  },
  updStudent(id, patch){
    const s = S.student(id); if (!s) return null;
    Object.assign(s, patch);
    S.emit('students');
    return s;
  },
  setStage(id, stage){
    const s = S.student(id); if (!s || s.stage === stage) return;
    const was = (C.STAGES.find(x => x.id === s.stage)||{}).name || '—';
    const now = (C.STAGES.find(x => x.id === stage)||{}).name || '—';
    s.stage = stage;
    s.stageAt = d.today();
    S.logAdd(S.studentName(id) + ': ' + was + ' → ' + now, 'stage');
    S.emit('students');
  },
  delStudent(id){
    const nm = S.studentName(id);
    S.db.students = S.db.students.filter(s => s.id !== id);
    S.db.lessons  = S.db.lessons.filter(l => l.studentId !== id);
    S.db.payments = S.db.payments.filter(p => p.studentId !== id);
    S.db.sounds   = S.db.sounds.filter(x => x.studentId !== id);
    S.db.tasks    = S.db.tasks.filter(t => t.studentId !== id);
    S.logAdd('Удалён ученик: ' + nm, 'danger');
    S.emit('students');
  },

  /* ───── занятия ───── */
  lesson(id){ return S.db.lessons.find(l => l.id === id) || null; },
  addLesson(data){
    const st = S.student(data.studentId);
    const ls = Object.assign({
      id: u.uid('ls'), studentId:'', date: d.today(), start:'10:00',
      dur: S.db.settings.duration, status:'planned', topic:'', notes:'', homework:'',
      score: 0, price: S.priceFor(st), createdAt: new Date().toISOString()
    }, data||{});
    S.db.lessons.push(ls);
    S.emit('lessons');
    return ls;
  },
  updLesson(id, patch){
    const l = S.lesson(id); if (!l) return null;
    Object.assign(l, patch);
    S.emit('lessons');
    return l;
  },
  setLessonStatus(id, status){
    const l = S.lesson(id); if (!l) return;
    l.status = status;
    if (status === 'done') l.doneAt = new Date().toISOString();
    S.logAdd(S.studentName(l.studentId) + ' · ' + d.fmtShort(l.date) + ' — ' + C.LESSON[status].name.toLowerCase(), 'lesson');
    S.emit('lessons');
  },
  delLesson(id){
    S.db.lessons = S.db.lessons.filter(l => l.id !== id);
    S.emit('lessons');
  },
  /* серия занятий: повтор каждую неделю в те же дни */
  addSeries(base, weekdays, weeks){
    const out = [];
    const start = d.weekStart(base.date);
    for (let w = 0; w < weeks; w++){
      weekdays.forEach(wd => {
        const date = d.add(start, w*7 + wd);
        if (date < base.date) return;
        out.push(S.addLessonSilent(Object.assign({}, base, { date })));
      });
    }
    S.emit('lessons');
    return out;
  },
  addLessonSilent(data){
    const st = S.student(data.studentId);
    const ls = Object.assign({
      id: u.uid('ls'), studentId:'', date: d.today(), start:'10:00', dur: S.db.settings.duration,
      status:'planned', topic:'', notes:'', homework:'', score:0, price: S.priceFor(st),
      createdAt: new Date().toISOString()
    }, data||{});
    S.db.lessons.push(ls);
    return ls;
  },
  /* занятия, пересекающиеся по времени с указанным интервалом */
  overlaps(date, start, dur, excludeId){
    const a1 = d.t2m(start), a2 = a1 + (Number(dur) || 45);
    return S.db.lessons.filter(l => {
      if (l.date !== date || l.id === excludeId || l.status === 'cancelled') return false;
      const b1 = d.t2m(l.start), b2 = b1 + (Number(l.dur) || 45);
      return a1 < b2 && b1 < a2;
    });
  },
  lessonsOf(studentId){ return S.db.lessons.filter(l => l.studentId === studentId); },
  lessonsOn(date){ return u.sortBy(S.db.lessons.filter(l => l.date === date), l => l.start); },
  lessonsBetween(from, to){ return u.sortBy(S.db.lessons.filter(l => l.date >= from && l.date <= to), l => l.date + l.start); },

  /* ───── оплаты ───── */
  addPayment(data){
    const p = Object.assign({
      id: u.uid('pm'), studentId:'', date: d.today(), amount:0, method:'cash',
      comment:'', forLessons:0, createdAt: new Date().toISOString()
    }, data||{});
    p.amount = Number(p.amount) || 0;
    S.db.payments.push(p);
    S.logAdd('Оплата ' + u.money(p.amount) + ' — ' + S.studentName(p.studentId), 'money');
    S.emit('payments');
    return p;
  },
  updPayment(id, patch){
    const p = S.db.payments.find(x => x.id === id); if (!p) return null;
    Object.assign(p, patch); p.amount = Number(p.amount) || 0;
    S.emit('payments'); return p;
  },
  delPayment(id){
    S.db.payments = S.db.payments.filter(p => p.id !== id);
    S.emit('payments');
  },
  paymentsOf(studentId){ return S.db.payments.filter(p => p.studentId === studentId); },

  /* ───── звуки / прогресс речи ───── */
  soundsOf(studentId){ return S.db.sounds.filter(x => x.studentId === studentId); },
  addSound(studentId, sound){
    const ex = S.db.sounds.find(x => x.studentId === studentId && x.sound === sound);
    if (ex) return ex;
    const s = { id:u.uid('sd'), studentId, sound, stage:1, note:'',
                updatedAt: d.today(), history:[{ date: d.today(), stage:1 }] };
    S.db.sounds.push(s);
    S.emit('sounds');
    return s;
  },
  setSoundStage(id, stage){
    const s = S.db.sounds.find(x => x.id === id); if (!s) return;
    stage = u.clamp(stage, 0, 5);
    if (s.stage === stage) return;
    s.stage = stage; s.updatedAt = d.today();
    s.history = s.history || [];
    s.history.push({ date: d.today(), stage });
    if (stage === 5) S.logAdd('🎉 ' + S.studentName(s.studentId) + ': звук «' + s.sound + '» в свободной речи', 'win');
    S.emit('sounds');
  },
  delSound(id){ S.db.sounds = S.db.sounds.filter(x => x.id !== id); S.emit('sounds'); },

  /* ───── тарифы ───── */
  addTariff(t){
    const x = Object.assign({ id:u.uid('tf'), name:'Новый тариф', price:S.db.settings.price,
                              lessons:1, duration:S.db.settings.duration }, t||{});
    S.db.tariffs.push(x); S.emit('tariffs'); return x;
  },
  updTariff(id, patch){ const t = S.db.tariffs.find(x => x.id === id); if (t) { Object.assign(t, patch); S.emit('tariffs'); } },
  delTariff(id){ S.db.tariffs = S.db.tariffs.filter(t => t.id !== id); S.emit('tariffs'); },
  tariff(id){ return S.db.tariffs.find(t => t.id === id) || null; },
  priceFor(st){
    if (!st) return S.db.settings.price;
    if (st.price != null && st.price !== '') return Number(st.price);
    const t = S.tariff(st.tariffId);
    if (t) return Math.round(t.price / Math.max(1, t.lessons));
    return S.db.settings.price;
  },

  /* ───── задачи ───── */
  addTask(t){
    const x = Object.assign({ id:u.uid('tk'), title:'', date:d.today(), done:false, studentId:'' }, t||{});
    S.db.tasks.push(x); S.emit('tasks'); return x;
  },
  toggleTask(id){ const t = S.db.tasks.find(x => x.id === id); if (t) { t.done = !t.done; S.emit('tasks'); } },
  delTask(id){ S.db.tasks = S.db.tasks.filter(t => t.id !== id); S.emit('tasks'); },

  /* ═════ РАСЧЁТЫ ═════ */

  /* сколько занятие «стоит» для расчёта долга */
  charge(l){
    if (l.status === 'done') return Number(l.price) || 0;
    if (l.status === 'missed' && S.db.settings.chargeMissed) return Number(l.price) || 0;
    return 0;
  },
  /* баланс: оплачено − начислено. Минус = долг */
  balance(studentId){
    const paid    = u.sum(S.paymentsOf(studentId), p => p.amount);
    const charged = u.sum(S.lessonsOf(studentId), S.charge);
    return paid - charged;
  },
  /* сколько занятий оплачено вперёд */
  prepaidLessons(studentId){
    const st = S.student(studentId); if (!st) return 0;
    const price = S.priceFor(st) || 1;
    return Math.floor(Math.max(0, S.balance(studentId)) / price);
  },
  stats(studentId){
    const ls = S.lessonsOf(studentId), t = d.today();
    const done = ls.filter(l => l.status === 'done');
    const missed = ls.filter(l => l.status === 'missed');
    const planned = u.sortBy(ls.filter(l => l.status === 'planned' && l.date >= t), l => l.date + l.start);
    const past = done.length + missed.length;
    const sounds = S.soundsOf(studentId);
    const soundPct = sounds.length ? Math.round(u.sum(sounds, s => s.stage) / (sounds.length * 5) * 100) : 0;
    return {
      done: done.length, missed: missed.length, planned: planned.length,
      attendance: past ? Math.round(done.length / past * 100) : null,
      next: planned[0] || null,
      last: u.sortBy(done, l => l.date + l.start, 'desc')[0] || null,
      revenue: u.sum(S.paymentsOf(studentId), p => p.amount),
      balance: S.balance(studentId),
      sounds: sounds.length, soundPct,
      hours: Math.round(u.sum(done, l => l.dur || 45) / 60)
    };
  },
  /* доход по месяцам: [{key,label,paid,earned}] */
  byMonth(n){
    const out = [], base = d.today();
    for (let i = n - 1; i >= 0; i--){
      const k = d.mKey(d.addMonths(base, -i));
      const dt = d.parse(k + '-01');
      out.push({
        key: k,
        label: C.MONS[dt.getMonth()],
        full: C.MONN[dt.getMonth()] + ' ' + dt.getFullYear(),
        paid:   u.sum(S.db.payments.filter(p => d.mKey(p.date) === k), p => p.amount),
        earned: u.sum(S.db.lessons.filter(l => d.mKey(l.date) === k), S.charge),
        lessons: S.db.lessons.filter(l => d.mKey(l.date) === k && l.status === 'done').length
      });
    }
    return out;
  },
  /* оплаты за месяц с 1-го числа по указанный день — чтобы сравнивать равные отрезки */
  paidThrough(key, day){
    const from = key + '-01', to = key + '-' + String(day).padStart(2, '0');
    return u.sum(S.db.payments.filter(p => p.date >= from && p.date <= to), p => p.amount);
  },
  /* насколько изменились поступления относительно прошлого месяца на ту же дату */
  monthTrend(){
    const t = d.today(), day = d.parse(t).getDate();
    const cur = S.paidThrough(d.mKey(t), day);
    const prev = S.paidThrough(d.mKey(d.addMonths(t, -1)), day);
    return { cur, prev, day, pct: prev ? Math.round((cur - prev) / prev * 100) : null };
  },
  monthMoney(key){
    key = key || d.mKey(d.today());
    const from = key + '-01', to = d.monthEnd(from);
    const ls = S.db.lessons.filter(l => l.date >= from && l.date <= to);
    return {
      key, from, to,
      paid:    u.sum(S.db.payments.filter(p => p.date >= from && p.date <= to), p => p.amount),
      earned:  u.sum(ls, S.charge),
      planned: u.sum(ls.filter(l => l.status === 'planned'), l => Number(l.price)||0),
      done:    ls.filter(l => l.status === 'done').length,
      missed:  ls.filter(l => l.status === 'missed').length,
      cancelled: ls.filter(l => l.status === 'cancelled').length,
      total:   ls.length
    };
  },
  activeStudents(){ return S.db.students.filter(s => !s.archived && ['active','trial','diagnostic'].includes(s.stage)); },
  debtors(){
    return S.db.students
      .filter(s => !s.archived && S.balance(s.id) < -(S.db.settings.debtLimit || 0))
      .map(s => ({ student: s, balance: S.balance(s.id) }))
      .sort((a,b) => a.balance - b.balance);
  },
  /* что требует внимания сегодня */
  alerts(){
    const out = [], t = d.today();
    S.debtors().forEach(x => out.push({
      kind:'debt', tone:'red', studentId:x.student.id,
      text:'Долг ' + u.money(-x.balance),
      sub: S.studentName(x.student.id)
    }));
    S.db.students.filter(s => !s.archived && s.stage === 'active').forEach(s => {
      const st = S.stats(s.id);
      if (!st.next) out.push({ kind:'noplan', tone:'amber', studentId:s.id,
        text:'Нет следующего занятия', sub: S.studentName(s.id) });
      else if (st.balance === 0 && st.done > 0 && S.priceFor(s) > 0) out.push({ kind:'prepay', tone:'amber', studentId:s.id,
        text:'Оплата закончилась', sub: S.studentName(s.id) });
    });
    S.db.students.filter(s => !s.archived && s.stage === 'lead').forEach(s => {
      const days = d.diff(s.since || d.iso(new Date(s.createdAt)), t);
      if (days >= 2) out.push({ kind:'lead', tone:'violet', studentId:s.id,
        text:'Заявка ждёт ' + u.nplural(days, ['день','дня','дней']), sub: S.studentName(s.id) });
    });
    S.db.students.filter(s => !s.archived && s.birth).forEach(s => {
      const b = d.parse(s.birth), n = d.parse(t);
      const next = new Date(n.getFullYear(), b.getMonth(), b.getDate());
      const days = d.diff(t, d.iso(next));
      if (days >= 0 && days <= 7) out.push({ kind:'bday', tone:'pink', studentId:s.id,
        text:'🎂 День рождения ' + (days === 0 ? 'сегодня' : d.human(d.iso(next))), sub: S.studentName(s.id) });
    });
    S.db.lessons.filter(l => l.status === 'planned' && l.date < t).forEach(l => out.push({
      kind:'stale', tone:'blue', studentId:l.studentId, lessonId:l.id,
      text:'Занятие ' + d.fmtShort(l.date) + ' не отмечено', sub: S.studentName(l.studentId)
    }));
    return out;
  },
  /* загрузка по дням недели: [{wd, count}] */
  loadByWeekday(fromDays){
    const from = d.add(d.today(), -(fromDays||56));
    const res = [0,0,0,0,0,0,0];
    S.db.lessons.filter(l => l.date >= from && l.status !== 'cancelled').forEach(l => res[d.dow(l.date)]++);
    return res;
  },
  searchAll(q){
    if (!q || q.trim().length < 1) return [];
    const res = [];
    S.db.students.forEach(s => {
      const hay = [s.first, s.last, s.parent, s.phone, s.messenger, s.diagnosis, s.notes].join(' ');
      if (u.match(hay, q)) res.push({ type:'student', id:s.id, title:(s.first+' '+(s.last||'')).trim(),
        sub:(C.STAGES.find(x=>x.id===s.stage)||{}).name || '', emoji:s.emoji, color:s.color });
    });
    return res.slice(0, 12);
  }
};

/* ═════ Демонстрационные данные ═════ */
S.seed = function(){
  let seed = 20260916;
  const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const ri = (a,b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[ri(0, arr.length - 1)];

  S.db.settings = Object.assign(S.db.settings, {
    therapist:'Мадина Каримова', clinic:'Логопедический кабинет «Речь+»',
    phone:'+998 90 123-45-67', currency:'сум', price:120000, onboarded:false
  });

  S.db.tariffs = [
    { id:'tf_one',  name:'Разовое занятие',        price:120000,  lessons:1,  duration:45 },
    { id:'tf_8',    name:'Абонемент 8 занятий',    price:880000,  lessons:8,  duration:45 },
    { id:'tf_12',   name:'Абонемент 12 занятий',   price:1260000, lessons:12, duration:45 },
    { id:'tf_diag', name:'Диагностика речи',       price:150000,  lessons:1,  duration:60 }
  ];

  const people = [
    ['Амина','Рахимова','2019-04-12','Дилноза Рахимова','+998 90 111-22-33','active','Дислалия: нарушены Р, Рь','Не выговаривает «Р», стесняется в саду','Инстаграм','tf_12'],
    ['Тимур','Соколов','2018-09-03','Ирина Соколова','+998 93 222-33-44','active','ФФНР, смешение шипящих','Путает С и Ш, «сапка» вместо «шапка»','Рекомендация','tf_8'],
    ['София','Ким','2020-01-22','Елена Ким','+998 94 333-44-55','active','Стёртая дизартрия','Речь смазанная, тихий голос','Поликлиника','tf_12'],
    ['Дамир','Юсупов','2017-06-30','Шахноза Юсупова','+998 97 444-55-66','active','ОНР III уровня','Короткие фразы, путает окончания','Детский сад','tf_8'],
    ['Алиса','Петрова','2019-11-08','Мария Петрова','+998 90 555-66-77','active','Ротацизм','Горловое «Р»','Инстаграм','tf_12'],
    ['Азиз','Турсунов','2018-02-14','Бекзод Турсунов','+998 91 666-77-88','active','Заикание, лёгкая степень','Запинки в начале фразы','Рекомендация','tf_8'],
    ['Мия','Абдуллаева','2021-03-19','Нилуфар Абдуллаева','+998 99 777-88-99','trial','Задержка речевого развития','В 3 года говорит ~30 слов','Телеграм','tf_one'],
    ['Лев','Григорьев','2019-07-25','Ольга Григорьева','+998 93 888-99-00','trial','Сигматизм','Межзубное произношение С, З','Сайт / поиск','tf_one'],
    ['Ясмина','Нортоджиева','2020-05-11','Зухра Нортоджиева','+998 90 999-00-11','diagnostic','—','Родитель жалуется на нечёткую речь','Инстаграм','tf_diag'],
    ['Марк','Волков','2018-12-01','Анна Волкова','+998 94 121-31-41','lead','—','Хотят подготовить к школе','Рекомендация',''],
    ['Камила','Садыкова','2019-08-17','Феруза Садыкова','+998 97 151-61-71','lead','—','Спрашивают про стоимость и расписание','Телеграм',''],
    ['Даниэль','Ли','2017-10-05','Виктория Ли','+998 90 181-91-01','paused','ФФНР','Сделали перерыв на лето','Детский сад','tf_8'],
    ['Роберт','Исмаилов','2016-04-09','Гульнара Исмаилова','+998 93 202-12-22','done','Ротацизм — исправлен','Звук Р поставлен и закреплён','Рекомендация','tf_12']
  ];

  const busy = {};
  people.forEach((p, i) => {
    const st = S.addStudentSilent({
      first:p[0], last:p[1], birth:p[2], parent:p[3], phone:p[4], stage:p[5],
      diagnosis:p[6], complaint:p[7], source:p[8], tariffId:p[9],
      color: C.PALETTE[i % C.PALETTE.length], emoji: C.EMOJI[i % C.EMOJI.length],
      since: d.add(d.today(), -ri(10, 240)),
      goal: p[5] === 'active' ? 'Чистая речь к школе' : ''
    });

    /* звуки в работе */
    if (['active','trial','paused','done'].includes(st.stage)){
      const set = st.diagnosis.includes('шипящ') || st.diagnosis.includes('ФФНР') ? ['Ш','Ж','С','З','Ч']
               : st.diagnosis.includes('Ротацизм') || st.diagnosis.includes('Р') ? ['Р','Рь','Л']
               : st.diagnosis.includes('игматизм') ? ['С','Сь','З','Ц']
               : ['Р','Л','Ш','С'];
      set.forEach(ch => {
        const stage = st.stage === 'done' ? 5 : ri(1, 4);
        S.db.sounds.push({
          id:u.uid('sd'), studentId:st.id, sound:ch, stage, note:'',
          updatedAt: d.add(d.today(), -ri(1,40)),
          history:[{ date: d.add(d.today(), -ri(40,80)), stage: 1 }, { date: d.add(d.today(), -ri(1,30)), stage }]
        });
      });
    }

    /* занятия: 8 недель назад → 2 недели вперёд */
    if (['active','trial','paused','done'].includes(st.stage)){
      const wd = [[0,2],[1,3],[0,3],[1,4],[2,4],[0,4],[1,3]][i % 7];
      const baseTime = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00'][i % 9];
      const weeksBack = st.stage === 'done' ? 20 : 16;
      const weeksFwd  = st.stage === 'active' ? 3 : (st.stage === 'trial' ? 1 : 0);
      for (let w = -weeksBack; w < weeksFwd; w++){
        wd.forEach(day => {
          const date = d.add(d.weekStart(d.today()), w*7 + day);
          if (st.stage === 'trial' && w < -2) return;
          if (st.stage === 'paused' && w > -3) return;
          if (st.stage === 'done' && w > -4) return;
          /* одно время — один ребёнок: ищем свободный слот */
          let time = baseTime, guard = 0;
          while (busy[date + ' ' + time] && guard++ < 10) time = d.m2t(d.t2m(time) + 60);
          busy[date + ' ' + time] = true;
          const past = date < d.today();
          let status = 'planned';
          if (past){ const r = rnd(); status = r < .82 ? 'done' : (r < .93 ? 'missed' : 'cancelled'); }
          S.db.lessons.push({
            id:u.uid('ls'), studentId:st.id, date, start:time, dur:45, status,
            topic: status === 'done' ? pick(['Автоматизация Р в словах','Артикуляционная гимнастика','Дифференциация С–Ш',
              'Постановка звука','Слоговая структура','Развитие фонематического слуха','Пересказ по картинкам','Лексика: профессии']) : '',
            notes: status === 'done' ? pick(['Хорошо работал, не отвлекался.','Устал к концу, сделали паузу.',
              'Получилось удержать язык вверху.','Мама подключилась, показала домашнее.','Нужен повтор темы.']) : '',
            homework: status === 'done' ? pick(['Повторять слоги ра-ро-ру 3 раза в день','«Грибок» и «Лошадка» по 5 раз',
              'Назвать 10 слов на звук Ш','Рассказ по картинке','Чистоговорки утром и вечером']) : '',
            score: status === 'done' ? ri(3,5) : 0,
            price: 120000, createdAt: new Date().toISOString()
          });
        });
      }
    }

    /* оплаты — закрывают большую часть начислений */
    if (['active','trial','paused','done'].includes(st.stage)){
      const mine = S.db.lessons.filter(l => l.studentId === st.id);
      const charged = u.sum(mine, S.charge);
      /* у большинства оплата закрывает занятия, у части — долг или предоплата */
      const r = rnd();
      const factor = st.stage !== 'active' ? 1 : (r < .2 ? .74 : r < .4 ? 1.12 : r < .55 ? .93 : 1);
      let left = Math.round(charged * factor / 10000) * 10000;
      let cursor = u.sortBy(mine, l => l.date)[0];
      cursor = cursor ? cursor.date : d.add(d.today(), -60);
      while (left > 0){
        const amt = Math.min(left, pick([880000, 1260000, 480000, 360000]));
        S.db.payments.push({
          id:u.uid('pm'), studentId:st.id, date:cursor, amount:amt,
          method: pick(['cash','card','transfer','card']), comment:'',
          forLessons: Math.round(amt / 120000), createdAt:new Date().toISOString()
        });
        left -= amt;
        cursor = d.add(cursor, ri(14, 26));
        if (cursor > d.today()) cursor = d.add(d.today(), -ri(0, 4));
      }
    }
  });

  S.db.tasks = [
    { id:u.uid('tk'), title:'Позвонить маме Марка — рассказать про расписание', date:d.today(), done:false, studentId:'' },
    { id:u.uid('tk'), title:'Подготовить карточки на звук Ш', date:d.today(), done:false, studentId:'' },
    { id:u.uid('tk'), title:'Отправить отчёт о динамике родителям Софии', date:d.add(d.today(),1), done:false, studentId:'' },
    { id:u.uid('tk'), title:'Купить зеркала для артикуляции', date:d.add(d.today(),3), done:false, studentId:'' }
  ];

  S.logAdd('Загружен демонстрационный кабинет', 'info');
};

S.addStudentSilent = function(data){
  const st = Object.assign({
    id:u.uid('st'), first:'', last:'', birth:'', parent:'', phone:'', messenger:'', source:'',
    stage:'lead', diagnosis:'', complaint:'', goal:'', tariffId:'', price:null,
    color:C.PALETTE[0], emoji:C.EMOJI[0], notes:'', createdAt:new Date().toISOString(),
    since:d.today(), archived:false
  }, data||{});
  S.db.students.push(st);
  return st;
};

LP.store = S;
})();
