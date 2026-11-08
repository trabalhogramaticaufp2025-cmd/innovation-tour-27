'use strict';

/* =====================================================
   DADOS DA VIAGEM — edita só esta secção.
   O site inteiro (Hoje, Programa, Mapas, Info, Avisos)
   é gerado a partir daqui.
   ===================================================== */
const TRIP = {
  start: null, // data de partida, ex.: '2027-03-10'
  end: null,   // data de regresso, ex.: '2027-03-17'
  cities: [
    { id: 'ny',  name: 'Nova Iorque', lat: 40.7128, lon: -74.0060, hotel: null },
    { id: 'phl', name: 'Filadélfia',  lat: 39.9526, lon: -75.1652, hotel: null },
    { id: 'dc',  name: 'Washington',  lat: 38.9072, lon: -77.0369, hotel: null }
    // hotel: { name: 'Hotel X', address: 'Rua, nº', lat: 40.75, lon: -73.99 }
  ],
  // type: 'mandatory' | 'optional' | 'free'  ·  meet: true marca o ponto de encontro
  days: [
    // { date: '2027-03-10', city: 'ny', items: [
    //   { time: '09:00', title: 'Visita a ...', type: 'mandatory', place: 'Morada',
    //     lat: 40.7, lon: -74.0, meet: true, note: 'Levar passaporte' }
    // ] }
  ],
  notices: [
    { id: 'n1', type: 'info', date: null, title: 'Bem-vindo à Innovation Tour 27!',
      text: 'Aqui vais encontrar avisos e alterações importantes do programa.' }
    // type: 'info' | 'urgent'
  ],
  info: [
    { icon: '✈️', title: 'Voos', text: 'Horários, companhias aéreas e informações dos voos a confirmar.' },
    { icon: '🚌', title: 'Transportes', text: 'Informações sobre deslocações entre cidades a confirmar.' }
  ],
  contacts: [
    { name: 'Emergência (EUA)', phone: '911', role: 'Polícia, bombeiros e ambulância' }
    // { name: 'Organização', phone: '+351 000 000 000', role: 'Coordenação da viagem' }
  ],
  faq: [
    { q: 'Preciso de internet para usar o site?', a: 'Depois de o abrires uma vez com ligação, a última informação fica guardada e podes consultá-la sem internet. A localização e o tempo precisam de ligação para atualizar.' },
    { q: 'E se me perder do grupo?', a: 'Abre "Hoje", toca em "Partilhar localização" e usa "Enviar" para mandar a tua posição a alguém do grupo. Depois toca em "Como chegar" no ponto de encontro.' },
    { q: 'Quem vê a minha localização?', a: 'Só tu. A posição é usada neste telemóvel para mostrar a cidade, a distância e o tempo. Só sai daqui se tocares em "Enviar" ou "Copiar".' }
  ]
};

/* ===== Utilitários ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('it27:' + k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('it27:' + k, JSON.stringify(v)); } catch { /* sem armazenamento */ } }
};
const TZ = 'America/New_York';
const state = { pos: null, w: store.get('w', null), watch: null, locMsg: '', loading: false, filter: store.get('filter', 'all') };
const cityById = id => TRIP.cities.find(c => c.id === id);

function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.id); toast.id = setTimeout(() => (t.hidden = true), 2200);
}
const hhmm = (tz, d = new Date()) => new Intl.DateTimeFormat('pt-PT', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
const todayISO = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date());
const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' });

function dist(lat1, lon1, lat2, lon2) { // km (haversine)
  const r = x => x * Math.PI / 180, a = Math.sin(r(lat2 - lat1) / 2) ** 2 +
    Math.cos(r(lat1)) * Math.cos(r(lat2)) * Math.sin(r(lon2 - lon1) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}
function nearest(lat, lon) {
  return TRIP.cities.map(c => ({ city: c, km: dist(lat, lon, c.lat, c.lon) })).sort((a, b) => a.km - b.km)[0];
}
const mapsPin = (lat, lon) => https://www.google.com/maps/search/?api=1&query=${lat},${lon};
const mapsText = q => https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)};
function mapsDir(it) {
  const dest = it.lat != null ? ${it.lat},${it.lon} : encodeURIComponent(it.place || '');
  const org = state.pos ? &origin=${state.pos.lat},${state.pos.lon} : '';
  return https://www.google.com/maps/dir/?api=1&destination=${dest}${org};
}
function mapsNear(q, lat, lon) {
  return https://www.google.com/maps/search/${encodeURIComponent(q)}/@${lat},${lon},15z;
}

/* ===== Programa: lógica ===== */
const flat = () => TRIP.days.flatMap(d => (d.items || []).map(i => ({ ...i, date: d.date, city: d.city })))
  .sort((a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')));
const nowKey = () => ${todayISO()} ${hhmm(TZ)};
const upcoming = fn => flat().find(i => ${i.date} ${i.time || '00:00'} >= nowKey() && (!fn || fn(i)));

function tripStatus() {
  if (!TRIP.start) return { k: 'tbd' };
  const t = todayISO(), d = daysBetween(t, TRIP.start);
  if (d > 0) return { k: 'before', n: d };
  if (TRIP.end && daysBetween(TRIP.end, t) > 0) return { k: 'after' };
  return { k: 'during', n: 1 - d, total: TRIP.end ? daysBetween(TRIP.start, TRIP.end) + 1 : null };
}
function currentCity() {
  const day = TRIP.days.find(d => d.date === todayISO());
  if (day) return cityById(day.city);
  if (state.pos) { const n = nearest(state.pos.lat, state.pos.lon); if (n.km <= 120) return n.city; }
  return null;
}

/* ===== Navegação ===== */
const PAGES = ['hoje', 'programa', 'mapas', 'informacoes', 'avisos'];
function show(id, push = true) {
  if (!PAGES.includes(id)) id = 'hoje';
  $$('.page').forEach(p => p.classList.toggle('active', p.id === id));
  $$('.nav-btn').forEach(b => {
    const on = b.dataset.page === id;
    b.classList.toggle('active', on);
    on ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current');
  });
  if (push && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
  window.scrollTo(0, 0);
  if (id === 'avisos') markRead();
}

/* ===== Hoje ===== */
function renderHero() {
  const s = tripStatus(), el = $('#hero');
  const big = (n, sub) => <div class="big">${n}</div><p class="sub">${sub}</p>;
  el.innerHTML =
    s.k === 'before' ? big(s.n, s.n === 1 ? 'dia para a partida' : 'dias para a partida') :
    s.k === 'during' ? big('Dia ' + s.n, s.total ? de ${s.total} · ${fmtDate(todayISO())} : fmtDate(todayISO())) :
    s.k === 'after' ? '<p class="sub">A viagem terminou. Obrigado por viajares connosco!</p>' :
    '<p class="sub">A data de partida será anunciada em breve.</p>';
const cur = currentCity(), today = todayISO();
  const idx = cur ? TRIP.cities.indexOf(cur) : (s.k === 'after' ? TRIP.cities.length : -1);
  $('#route').innerHTML = TRIP.cities.map((c, i) =>
    <li class="${i < idx ? 'past' : ''} ${i === idx ? 'on' : ''}">${esc(c.name)}</li>).join('');
  $('#now-city').textContent = cur ? cur.name : 'A definir';
}

function renderNext() {
  const nx = upcoming(), box = $('#now-next'), meet = $('#now-meet');
  box.innerHTML = nx
    ? <h3>${esc(nx.title)}</h3><p class="muted">${nx.date === todayISO() ? 'Hoje' : fmtDate(nx.date)}${nx.time ? ' às ' + esc(nx.time) : ''}</p>
    : '<h3>A definir</h3>';
  const m = upcoming(i => i.meet);
  meet.innerHTML = m
    ? `<h3>${esc(m.place || m.title)}</h3><p class="muted">${m.date === todayISO() ? 'Hoje' : fmtDate(m.date)}${m.time ? ' às ' + esc(m.time) : ''}</p>
       <div class="btn-row"><a class="btn primary" target="_blank" rel="noopener" href="${mapsDir(m)}">Como chegar</a></div>`
    : '<h3>A definir</h3><p class="muted">O local e a hora de encontro aparecem aqui assim que forem confirmados.</p>';
}

/* ===== Localização ===== */
function locate() {
  if (!('geolocation' in navigator)) return setLocMsg('Este navegador não suporta localização.');
  if (!window.isSecureContext) return setLocMsg('A localização só funciona numa ligação segura (https).');
  state.loading = true; state.locMsg = ''; renderLoc();
  navigator.geolocation.getCurrentPosition(onPos, onErr, { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 });
}
function setLocMsg(m) { state.locMsg = m; state.loading = false; renderLoc(); }
function onPos(p) {
  state.loading = false; state.locMsg = '';
  state.pos = { lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) };
  renderHero(); renderNext(); renderLoc(); renderMaps();
  loadWeather(state.pos.lat, state.pos.lon, 'Na tua posição');
}
function onErr(e) {
  setLocMsg(e.code === 1
    ? 'Localização bloqueada. Ativa-a nas definições do navegador ou do telemóvel para este site e tenta outra vez.'
    : e.code === 3 ? 'A localização demorou demasiado. Vai para um sítio aberto e tenta outra vez.'
    : 'Não foi possível obter a localização.');
}
function toggleWatch() {
  if (state.watch != null) { navigator.geolocation.clearWatch(state.watch); state.watch = null; }
  else state.watch = navigator.geolocation.watchPosition(onPos, onErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  renderLoc();
}
function renderLoc() {
  const box = $('#loc'), p = state.pos;
  if (!p) {
    box.innerHTML = `<p class="note ${state.locMsg ? 'warn' : ''}">${state.locMsg ||
      'Vê em que cidade estás, a distância ao centro, a hora local e o tempo. A posição fica só neste telemóvel.'}</p>
      <div class="btn-row"><button class="btn primary" data-act="locate" ${state.loading ? 'disabled' : ''}>${state.loading ? 'A localizar…' : 'Partilhar localização'}</button></div>`;
    return; }
  const n = nearest(p.lat, p.lon), km = n.km, near = km <= 120;
  const where = km < 1 ? No centro de ${esc(n.city.name)} :
    near ? A ${km.toFixed(km < 10 ? 1 : 0)} km do centro de ${esc(n.city.name)} :
    A ${Math.round(km)} km de ${esc(n.city.name)}, a cidade da viagem mais próxima;
  box.innerHTML = `<h3>${where}</h3>
    <p class="muted">${Math.round(km * 0.621)} mi · precisão de cerca de ${p.acc} m</p>
    <div class="btn-row">
      <a class="btn" target="_blank" rel="noopener" href="${mapsPin(p.lat, p.lon)}">Ver no mapa</a>
      <button class="btn" data-act="share">Enviar</button>
      <button class="btn" data-act="copy">Copiar</button>
      <button class="btn" data-act="watch" aria-pressed="${state.watch != null}">${state.watch != null ? 'A seguir' : 'Seguir'}</button>
      <button class="btn" data-act="locate">Atualizar</button>
    </div>
    <div class="btn-row"><a class="btn danger" href="tel:911">Emergência (911)</a></div>`;
}
async function shareLoc() {
  const p = state.pos; if (!p) return;
  const url = mapsPin(p.lat, p.lon);
  if (navigator.share) { try { await navigator.share({ title: 'A minha localização', text: 'Estou aqui:', url }); } catch { /* cancelado */ } }
  else copyLoc();
}
async function copyLoc() {
  const p = state.pos; if (!p) return;
  const url = mapsPin(p.lat, p.lon);
  try { await navigator.clipboard.writeText(url); toast('Localização copiada'); }
  catch { prompt('Copia a ligação:', url); }
}

/* ===== Tempo (Open-Meteo, sem chave) ===== */
const WMO = c => c === 0 ? ['☀️', 'Céu limpo'] : c <= 2 ? ['🌤️', 'Pouco nublado'] : c === 3 ? ['☁️', 'Nublado'] :
  c <= 48 ? ['🌫️', 'Nevoeiro'] : c <= 57 ? ['🌦️', 'Chuvisco'] : c <= 67 ? ['🌧️', 'Chuva'] :
  c <= 77 ? ['❄️', 'Neve'] : c <= 82 ? ['🌦️', 'Aguaceiros'] : c <= 86 ? ['🌨️', 'Neve'] : ['⛈️', 'Trovoada'];
async function loadWeather(lat, lon, label) {
  const w = state.w;
  if (w && Date.now() - w.t < 9e5 && dist(lat, lon, w.lat, w.lon) < 3) { state.w.label = label; return renderWeather(); }
  try {
    const r = await fetch(https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto);
    if (!r.ok) throw new Error('http');
    const j = await r.json();
    state.w = { t: Date.now(), lat, lon, label, c: j.current };
    store.set('w', state.w);
  } catch { /* mantém o último valor guardado */ }
  renderWeather();
}
function renderWeather() {
  const w = state.w, box = $('#weather');
  if (!w) { box.innerHTML = '<p class="muted">Sem dados do tempo. Liga-te à internet para os veres.</p>'; return; }
  const c = w.c, [em, txt] = WMO(c.weather_code), f = Math.round(c.temperature_2m * 9 / 5 + 32);
  const mins = Math.round((Date.now() - w.t) / 60000);
  box.innerHTML = `<div class="weather-main"><span class="em">${em}</span>
    <div><b>${Math.round(c.temperature_2m)} °C</b> <span class="muted">(${f} °F)</span>
    <p>${txt} · sensação de ${Math.round(c.apparent_temperature)} °C · vento ${Math.round(c.wind_speed_10m)} km/h</p></div></div>
    <p class="note">${esc(w.label || '')}${mins > 20 ? ' · atualizado há ' + mins + ' min' : ''}</p>`;
}function weatherForCity() {
  const c = currentCity() || TRIP.cities[0];
  loadWeather(c.lat, c.lon, currentCity() ? c.name : c.name + ' (cidade inicial)');
}

/* ===== Relógio ===== */
function tick() {
  $('#clock').innerHTML = <b>${hhmm(TZ)}</b> EUA<br>${hhmm('Europe/Lisbon')} Portugal;
}

/* ===== Programa ===== */
const TYPES = { mandatory: 'Obrigatória', optional: 'Opcional', free: 'Tempo livre' };
function renderProgram() {
  const F = [['all', 'Todas'], ['mandatory', 'Obrigatórias'], ['optional', 'Opcionais'], ['free', 'Tempo livre']];
  $('#prog-filters').innerHTML = F.map(([k, l]) => <button class="chip" data-filter="${k}" aria-pressed="${state.filter === k}">${l}</button>).join('');
  const list = $('#prog-list'), going = store.get('going', {}), today = todayISO();
  if (!TRIP.days.length) {
    list.innerHTML = TRIP.cities.map((c, i) => `<div class="card"><span class="card-label">Cidade ${i + 1}</span>
      <h3>${esc(c.name)}</h3><p class="muted">Programa e atividades a confirmar.</p></div>`).join('');
    return;
  }
  list.innerHTML = TRIP.cities.map(c => {
    const days = TRIP.days.filter(d => d.city === c.id);
    if (!days.length) return <div class="card"><h3>${esc(c.name)}</h3><p class="muted">Programa e atividades a confirmar.</p></div>;
    const open = days.some(d => d.date === today) || (!TRIP.days.some(d => d.date === today) && c === TRIP.cities[0]);
    const body = days.map(d => {
      const items = (d.items || []).filter(i => state.filter === 'all' || i.type === state.filter);
      if (!items.length) return '';
      return <p class="day-label ${d.date === today ? 'today' : ''}">${fmtDate(d.date)}${d.date === today ? ' · hoje' : ''}</p> +
        items.map(i => {
          const key = ${d.date}|${i.time}|${i.title};
          return `<div class="act"><span class="time">${esc(i.time || '')}</span><div>
            <span class="tag ${esc(i.type)}">${TYPES[i.type] || ''}</span>
            <h4>${esc(i.title)}</h4>
            ${i.place ? <p class="meta"><a target="_blank" rel="noopener" href="${i.lat != null ? mapsPin(i.lat, i.lon) : mapsText(i.place)}">${esc(i.place)}</a></p> : ''}
            ${i.note ? <p class="meta">${esc(i.note)}</p> : ''}
            ${i.type === 'optional' ? <label class="going"><input type="checkbox" data-going="${esc(key)}" ${going[key] ? 'checked' : ''}> Vou participar</label> : ''}
          </div></div>`;
        }).join('');
    }).join('');
    return <details class="card" ${open ? 'open' : ''}><summary><h3>${esc(c.name)}</h3></summary>${body || '<p class="muted">Nenhuma atividade neste filtro.</p>'}</details>;
  }).join('');
}

/* ===== Mapas ===== */
function renderMaps() {
  const p = state.pos, base = p ? { lat: p.lat, lon: p.lon } : null;
  const Q = [['Restaurantes', 'restaurants'], ['Café', 'coffee'], ['Farmácia', 'pharmacy'], ['Casa de banho', 'public restroom'], ['Metro', 'subway station'], ['Multibanco', 'ATM']];
  $('#maps-near').innerHTML = base
    ? <h3>Perto de mim</h3><div class="btn-row">${Q.map(([l, q]) => `<a class="btn" target="_blank" rel="noopener" href="${mapsNear(q, base.lat, base.lon)}">${l}</a>).join('')}</div>`  : `<h3>Perto de mim</h3><p class="note">Partilha a tua localização para procurar restaurantes, farmácias, metro e mais à tua volta.</p>
       <div class="btn-row"><button class="btn primary" data-act="locate">Partilhar localização</button></div>`;
  $('#maps-list').innerHTML = TRIP.cities.map(c => {
    const d = p ? <p class="muted">A ${Math.round(dist(p.lat, p.lon, c.lat, c.lon))} km de ti</p> : '';
    const h = c.hotel ? <p class="meta">🏨 ${esc(c.hotel.name)}${c.hotel.address ? ' · ' + esc(c.hotel.address) : ''}</p> : '<p class="muted">Hotéis, visitas e pontos de encontro.</p>';
    const hotelBtn = c.hotel ? <a class="btn" target="_blank" rel="noopener" href="${mapsDir(c.hotel.lat != null ? c.hotel : { place: c.hotel.address || c.hotel.name })}">Ir para o hotel</a> : '';
    return `<div class="card"><h3>${esc(c.name)}</h3>${d}${h}
      <div class="btn-row"><a class="btn primary" target="_blank" rel="noopener" href="${mapsPin(c.lat, c.lon)}">Abrir no Google Maps</a>${hotelBtn}</div></div>`;
  }).join('');
}

/* ===== Informações ===== */
function renderInfo() {
  const hotels = TRIP.cities.filter(c => c.hotel);
  const blocks = [
    ...TRIP.info.filter(i => i.title !== 'Hotéis').map(i => ({ icon: i.icon, title: i.title, html: <p>${esc(i.text)}</p> })),
    { icon: '🏨', title: 'Hotéis', html: hotels.length
      ? hotels.map(c => <p><b>${esc(c.name)}:</b> ${esc(c.hotel.name)}${c.hotel.address ? '<br><span class="muted">' + esc(c.hotel.address) + '</span>' : ''}</p>).join('')
      : '<p>Moradas e informações de alojamento a confirmar.</p>' },
    { icon: '📞', title: 'Contactos úteis', html: TRIP.contacts.map(c =>
      `<div class="contact"><div><b>${esc(c.name)}</b><br><span class="muted">${esc(c.role)}</span></div>
       <a class="btn" href="tel:${esc(c.phone.replace(/\s/g, ''))}">${esc(c.phone)}</a></div>`).join('') },
    { icon: '❓', title: 'Perguntas frequentes', html: TRIP.faq.map(f => <p><b>${esc(f.q)}</b><br>${esc(f.a)}</p><br>).join('') }
  ];
  $('#info-list').innerHTML = blocks.map(b =>
    <details class="card"><summary><h3>${b.icon} ${esc(b.title)}</h3></summary>${b.html}</details>).join('');
}

/* ===== Avisos ===== */
const seen = () => store.get('seen', []);
function noticeHTML(n, isNew) {
  const d = n.date ? new Date(n.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short' }) : '';
  return `<div class="card"><span class="tag ${n.type === 'urgent' ? 'urgent' : ''}">${n.type === 'urgent' ? 'Urgente' : 'Informação'}</span>
    ${isNew ? ' <span class="tag new">Novo</span>' : ''}<h3>${esc(n.title)}</h3><p>${esc(n.text)}</p>${d ? <p class="note">${d}</p> : ''}</div>`;
}
function renderNotices() {
  const s = seen(), N = TRIP.notices;
  $('#notice-list').innerHTML = N.length ? N.map(n => noticeHTML(n, !s.includes(n.id))).join('') : '<p class="muted">Sem avisos por agora.</p>';
  const urgent = N.filter(n => n.type === 'urgent').slice(0, 2);
  $('#now-notices').innerHTML = urgent.length ? <span class="card-label">Avisos importantes</span> + urgent.map(n => noticeHTML(n, false)).join('') : '<div class="card"><span class="card-label">Avisos importantes</span><p class="muted">Sem avisos urgentes.</p></div>';
  updateBadge();
}
function updateBadge() {
  const n = TRIP.notices.filter(x => !seen().includes(x.id)).length, b = $('#nav-badge');
  b.hidden = !n; b.textContent = n;
}
function markRead() { store.set('seen', TRIP.notices.map(n => n.id)); updateBadge(); }

/* ===== Eventos ===== */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-page]'); if (nav) return show(nav.dataset.page);
  const f = e.target.closest('[data-filter]');
  if (f) { state.filter = f.dataset.filter; store.set('filter', state.filter); return renderProgram(); }
  const a = e.target.closest('[data-act]'); if (!a) return;
  ({ locate, share: shareLoc, copy: copyLoc, watch: toggleWatch })[a.dataset.act]?.();
});
document.addEventListener('change', e => {
  const g = e.target.dataset?.going; if (!g) return;
  const o = store.get('going', {}); o[g] = e.target.checked; store.set('going', o);
});
window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
const setOffline = () => ($('#offline').hidden = navigator.onLine);
window.addEventListener('online', () => { setOffline(); weatherForCity(); });
window.addEventListener('offline', setOffline);

/* ===== Arranque ===== */
renderHero(); renderNext(); renderLoc(); renderWeather(); renderProgram(); renderMaps(); renderInfo(); renderNotices();
tick(); setInterval(() => { tick(); renderNext(); }, 30000);
setOffline();
show(location.hash.slice(1) || 'hoje', false);
weatherForCity();
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
