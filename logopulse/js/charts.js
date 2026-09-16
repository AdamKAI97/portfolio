/* ═══════════════════════════════════════════════════════════
   ЛогоПульс · charts.js — графики на чистом SVG (без библиотек)
   ═══════════════════════════════════════════════════════════ */
(function(){
const u = LP.u;
const GR = { main:['#22d3ee','#6f7bff'], warm:['#ffc24b','#f472b6'], good:['#6ee7a0','#22d3ee'], violet:['#a855f7','#f472b6'] };

function defs(id, pair, vertical){
  return '<linearGradient id="' + id + '" x1="0" y1="' + (vertical ? '0' : '0') + '" x2="' + (vertical ? '0' : '1') + '" y2="' + (vertical ? '1' : '0') + '">'
    + '<stop offset="0" stop-color="' + pair[0] + '"/><stop offset="1" stop-color="' + pair[1] + '"/></linearGradient>';
}
/* верхняя граница оси так, чтобы подписи делений были круглыми */
function nice(max, ticks){
  ticks = ticks || 4;
  if (max <= 0) return ticks;
  const raw = max / ticks;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / p;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  return step * ticks;
}
function fmt(v, money){ return money ? u.moneyShort(v) : u.num(v); }

const chart = {
  /* Сгруппированные столбцы: две серии по месяцам */
  grouped(data, o){
    o = o || {};
    const W = 640, H = o.height || 240, L = 52, R = 10, T = 18, B = 30;
    const iw = W - L - R, ih = H - T - B;
    const max = nice(Math.max(1, ...data.map(d => Math.max(d.a || 0, d.b || 0))), 4);
    const step = iw / Math.max(1, data.length);
    const bw = Math.min(26, step * 0.3);
    const uid = 'g' + u.hash(JSON.stringify(data.map(d=>d.label))).toString(36).replace('-','x');
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + u.esc(o.aria || 'График') + '">'
      + '<defs>' + defs(uid + 'a', GR.main, true) + defs(uid + 'b', GR.warm, true) + '</defs>';
    for (let i = 0; i <= 4; i++){
      const y = T + ih - ih * i / 4;
      s += '<line class="grid-l" x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/>'
         + '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(max * i / 4, o.money) + '</text>';
    }
    data.forEach((d, i) => {
      const x = L + step * i + step / 2;
      const ha = ih * (d.a || 0) / max, hb = ih * (d.b || 0) / max;
      s += '<rect class="bar" x="' + (x - bw - 2) + '" y="' + (T + ih - ha) + '" width="' + bw + '" height="' + Math.max(0, ha)
        + '" rx="5" fill="url(#' + uid + 'a)"><title>' + u.esc(d.full || d.label) + ' · ' + u.esc(o.na || 'A') + ': ' + fmt(d.a, o.money) + '</title></rect>'
        + '<rect class="bar" x="' + (x + 2) + '" y="' + (T + ih - hb) + '" width="' + bw + '" height="' + Math.max(0, hb)
        + '" rx="5" fill="url(#' + uid + 'b)"><title>' + u.esc(d.full || d.label) + ' · ' + u.esc(o.nb || 'B') + ': ' + fmt(d.b, o.money) + '</title></rect>'
        + '<text x="' + x + '" y="' + (H - 9) + '" text-anchor="middle">' + u.esc(d.label) + '</text>';
    });
    return s + '</svg>';
  },

  /* Одиночные столбцы */
  bars(data, o){
    o = o || {};
    const W = 640, H = o.height || 220, L = 50, R = 10, T = 16, B = 28;
    const iw = W - L - R, ih = H - T - B;
    const max = nice(Math.max(1, ...data.map(d => d.value || 0)), 3);
    const step = iw / Math.max(1, data.length);
    const bw = Math.min(40, step * 0.58);
    const uid = 'b' + Math.abs(u.hash(String(data.length) + (o.aria||''))).toString(36);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + u.esc(o.aria || 'График') + '">'
      + '<defs>' + defs(uid, GR[o.grad || 'main'], true) + '</defs>';
    for (let i = 0; i <= 3; i++){
      const y = T + ih - ih * i / 3;
      s += '<line class="grid-l" x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/>'
         + '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(max * i / 3, o.money) + '</text>';
    }
    data.forEach((d, i) => {
      const x = L + step * i + (step - bw) / 2;
      const h = ih * (d.value || 0) / max;
      s += '<rect class="bar" x="' + x + '" y="' + (T + ih - h) + '" width="' + bw + '" height="' + Math.max(0, h)
        + '" rx="6" fill="' + (d.color || 'url(#' + uid + ')') + '"><title>' + u.esc(d.label) + ': ' + fmt(d.value, o.money) + '</title></rect>'
        + (h > 22 ? '<text x="' + (x + bw/2) + '" y="' + (T + ih - h + 15) + '" text-anchor="middle" style="fill:#05070f;font-weight:800">'
            + fmt(d.value, o.money) + '</text>' : '')
        + '<text x="' + (x + bw/2) + '" y="' + (H - 8) + '" text-anchor="middle">' + u.esc(d.label) + '</text>';
    });
    return s + '</svg>';
  },

  /* Линия с заливкой */
  area(data, o){
    o = o || {};
    const W = 640, H = o.height || 220, L = 50, R = 12, T = 18, B = 28;
    const iw = W - L - R, ih = H - T - B;
    const max = nice(Math.max(1, ...data.map(d => d.value || 0)), 3);
    const n = Math.max(1, data.length - 1);
    const X = i => L + iw * i / n, Y = v => T + ih - ih * (v || 0) / max;
    const uid = 'a' + Math.abs(u.hash(String(data.length) + (o.aria||''))).toString(36);
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + u.esc(o.aria || 'График') + '">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="' + GR[o.grad||'main'][0] + '" stop-opacity=".55"/>'
      + '<stop offset="1" stop-color="' + GR[o.grad||'main'][1] + '" stop-opacity="0"/></linearGradient>'
      + defs(uid + 'l', GR[o.grad||'main'], false) + '</defs>';
    for (let i = 0; i <= 3; i++){
      const y = T + ih - ih * i / 3;
      s += '<line class="grid-l" x1="' + L + '" y1="' + y + '" x2="' + (W - R) + '" y2="' + y + '"/>'
         + '<text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(max * i / 3, o.money) + '</text>';
    }
    const pts = data.map((d, i) => X(i) + ',' + Y(d.value));
    s += '<path class="area" d="M' + L + ',' + (T + ih) + ' L' + pts.join(' L') + ' L' + X(n) + ',' + (T + ih) + ' Z" fill="url(#' + uid + ')"/>'
       + '<path class="line" d="M' + pts.join(' L') + '" stroke="url(#' + uid + 'l)"/>';
    data.forEach((d, i) => {
      s += '<circle class="pt" cx="' + X(i) + '" cy="' + Y(d.value) + '" r="4" fill="var(--bg-0)" stroke="' + GR[o.grad||'main'][0] + '" stroke-width="2.4">'
        + '<title>' + u.esc(d.full || d.label) + ': ' + fmt(d.value, o.money) + '</title></circle>'
        + '<text x="' + X(i) + '" y="' + (H - 8) + '" text-anchor="middle">' + u.esc(d.label) + '</text>';
    });
    return s + '</svg>';
  },

  /* Кольцевая диаграмма */
  donut(items, o){
    o = o || {};
    const S = o.size || 190, r = S/2 - 14, cx = S/2, cy = S/2, C = 2*Math.PI*r;
    const total = u.sum(items, x => x.value) || 1;
    let off = 0;
    let s = '<svg class="chart" viewBox="0 0 ' + S + ' ' + S + '" style="width:' + S + 'px;height:' + S + 'px" role="img">'
      + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="var(--line)" stroke-width="20"/>';
    items.forEach(it => {
      const frac = (it.value || 0) / total, len = C * frac;
      if (len <= 0) return;
      s += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + it.color + '" stroke-width="20"'
        + ' stroke-dasharray="' + (len - 2).toFixed(1) + ' ' + (C - len + 2).toFixed(1) + '"'
        + ' stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')" stroke-linecap="butt">'
        + '<title>' + u.esc(it.label) + ': ' + fmt(it.value, o.money) + ' (' + Math.round(frac*100) + '%)</title></circle>';
      off += len;
    });
    s += '<text x="' + cx + '" y="' + (cy - 2) + '" text-anchor="middle" style="font-family:var(--ff-d);font-size:20px;fill:var(--txt)">'
      + u.esc(o.centerTop || fmt(total, o.money)) + '</text>'
      + '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" style="font-size:11px">' + u.esc(o.centerSub || '') + '</text>';
    return s + '</svg>';
  },

  /* Горизонтальный рейтинг */
  hbars(items, o){
    o = o || {};
    const max = Math.max(1, ...items.map(i => i.value));
    return '<div class="list">' + items.map(it =>
      '<div class="row" style="gap:12px">'
      + '<span class="trunc" style="width:' + (o.labelW || 130) + 'px;font-size:13px;font-weight:600">' + u.esc(it.label) + '</span>'
      + '<span class="grow"><span class="pbar pbar--thin" style="display:block"><span class="pbar__fill" style="display:block;width:'
      + (it.value / max * 100).toFixed(1) + '%;' + (it.color ? 'background:' + it.color : '') + '"></span></span></span>'
      + '<span class="mono" style="font-size:12.5px;min-width:74px;text-align:right">' + fmt(it.value, o.money) + '</span>'
      + '</div>').join('') + '</div>';
  },

  /* Мини-спарклайн для KPI */
  spark(values, o){
    o = o || {};
    const W = 260, H = 46;
    const max = Math.max(1, ...values), min = Math.min(...values, 0);
    const n = Math.max(1, values.length - 1);
    const X = i => W * i / n, Y = v => H - 6 - (H - 12) * (v - min) / Math.max(1, max - min);
    const pts = values.map((v, i) => X(i) + ',' + Y(v));
    const col = o.color || '#22d3ee';
    const uid = 's' + Math.abs(u.hash(values.join(','))).toString(36);
    return '<svg class="kpi__spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">'
      + '<defs><linearGradient id="' + uid + '" x1="0" y1="0" x2="0" y2="1">'
      + '<stop offset="0" stop-color="' + col + '" stop-opacity=".45"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>'
      + '<path d="M0,' + H + ' L' + pts.join(' L') + ' L' + W + ',' + H + ' Z" fill="url(#' + uid + ')"/>'
      + '<path d="M' + pts.join(' L') + '" fill="none" stroke="' + col + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>';
  },

  /* Тепловая карта загрузки: дни недели × часы */
  heat(matrix, o){
    o = o || {};
    const max = Math.max(1, ...matrix.flat());
    const hours = o.hours || [];
    let s = '<div style="display:grid;grid-template-columns:auto repeat(7,1fr);gap:4px;align-items:center">';
    s += '<span></span>' + LP.C.WDS.map(w => '<span class="center dim" style="font-size:10.5px">' + w + '</span>').join('');
    matrix[0].forEach((_, h) => {
      s += '<span class="dim mono" style="font-size:10.5px;padding-right:6px">' + hours[h] + '</span>';
      for (let wd = 0; wd < 7; wd++){
        const v = matrix[wd][h], a = v / max;
        s += '<div class="heat__c" style="background:' + (v ? 'color-mix(in srgb,var(--c-cyan) ' + Math.round(14 + a*72) + '%,transparent)' : 'transparent')
          + ';' + (v ? 'color:#fff;border-color:transparent' : '') + '" title="' + LP.C.WD[wd] + ' ' + hours[h] + ' — '
          + u.nplural(v, ['занятие','занятия','занятий']) + '">' + (v || '') + '</div>';
      }
    });
    return s + '</div>';
  }
};
LP.chart = chart;
})();
