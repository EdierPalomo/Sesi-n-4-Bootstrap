// URL de la API:
// - Si abres la página desde el propio backend (http://localhost:3000) usa ruta relativa.
// - Si abres index.html con doble clic (file://) u otro servidor, usa localhost:3000.
// - Puedes forzar otra URL definiendo window.API_URL antes de cargar este script.
const API = window.API_URL
  || (location.protocol === 'file:' ? 'http://localhost:3000/api' : `${location.origin}/api`);

const $ = (sel) => document.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

async function api(path, method = 'GET', body) {
  const r = await fetch(API + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error((await r.json()).error || `Error ${r.status}`);
  return r.json();
}

const fmtDate = (iso) => new Date(iso).toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' });
const pad = (n) => String(n).padStart(6, '0');

// ---------- Página principal (index.html) ----------

let page = 1;

async function loadFeed() {
  const data = await api(`/articles?page=${page}&limit=3`);
  const feed = $('#feed');
  if (!feed) return;

  feed.innerHTML = data.items.length === 0
    ? '<div class="alert alert-warning border border-dark">No hay artículos aún. ¡Sé el primero en publicar!</div>'
    : data.items.map((a, i) => `
      <article class="card mb-4 bg-white">
        ${i === 0 && page === 1 ? `
        <div class="card-header bg-warning border-bottom border-dark fw-bold d-flex justify-content-between align-items-center">
          <span><i class="bi bi-star-fill"></i> TEMA DE PORTADA</span>
          <span class="badge bg-dark">Más reciente</span>
        </div>` : ''}
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center mb-2">
            <span class="badge bg-danger">${esc(a.category)}</span>
            <small class="text-muted">${fmtDate(a.created_at)}</small>
          </div>
          <h3 class="card-title h4 fw-bold">${esc(a.title)}</h3>
          <p class="text-muted small mb-2">
            <i class="bi bi-clock"></i> ${a.read_minutes} min de lectura | <i class="bi bi-person"></i> ${esc(a.author)}
          </p>
          <p class="card-text">${esc(a.excerpt)}</p>
        </div>
        <div class="card-footer bg-light border-top border-dark d-flex justify-content-between align-items-center">
          <button class="btn btn-outline-danger btn-sm btn-like" data-slug="${esc(a.slug)}">
            <i class="bi bi-hand-thumbs-up"></i> ${a.likes}
          </button>
          <a class="btn btn-dark btn-sm" href="articulo.html?slug=${encodeURIComponent(a.slug)}">
            <i class="bi bi-book"></i> Leer completo
          </a>
        </div>
      </article>`).join('');

  renderPagination(data.pages);
  feed.querySelectorAll('.btn-like').forEach((b) => b.addEventListener('click', async () => {
    try {
      const r = await api(`/articles/${b.dataset.slug}/like`, 'POST');
      b.innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> ${r.likes}`;
    } catch (e) { alert(e.message); }
  }));
}

function renderPagination(pages) {
  const nav = $('#pagination');
  if (!nav) return;
  if (pages <= 1) { nav.innerHTML = ''; return; }
  const btn = (label, p, cls = '') =>
    `<li class="page-item ${cls}"><a class="page-link ${p === page ? 'bg-dark border-dark' : 'text-dark'}" href="#" data-page="${p}">${label}</a></li>`;
  let html = btn('&laquo; Anterior', Math.max(1, page - 1), page === 1 ? 'disabled' : '');
  for (let p = 1; p <= pages; p++) html += btn(p, p, p === page ? 'active' : '');
  html += btn('Siguiente &raquo;', Math.min(pages, page + 1), page === pages ? 'disabled' : '');
  nav.innerHTML = html;
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    page = parseInt(a.dataset.page);
    loadFeed();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }));
}

async function loadCategories() {
  const ul = $('#categories');
  if (!ul) return;
  const cats = await api('/categories');
  ul.innerHTML = cats.map((c) => `
    <li class="list-group-item d-flex justify-content-between align-items-center">
      ${esc(c.name)} <span class="badge bg-primary rounded-pill">${c.count}</span>
    </li>`).join('') || '<li class="list-group-item text-muted">Sin categorías</li>';
}

async function loadGuestbook() {
  const ul = $('#guestbook-list');
  if (!ul) return;
  const entries = await api('/guestbook');
  ul.innerHTML = entries.map((g) => `
    <li class="list-group-item px-0 py-2">
      <strong class="text-primary">${esc(g.nickname)}</strong>
      <small class="text-muted d-block">${fmtDate(g.created_at)}</small>
      ${esc(g.message)}
    </li>`).join('') || '<li class="list-group-item px-0 text-muted">Aún no hay firmas...</li>';
}

async function bumpVisits() {
  const el = $('#visit-counter');
  if (!el) return;
  try {
    const { visits } = await api('/visits', 'POST');
    el.textContent = pad(visits);
  } catch { el.textContent = pad(0); }
}

function hookGuestbookForm() {
  const form = $('#guestbook-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await api('/guestbook', 'POST', {
        nickname: form.nickname.value,
        message: form.message.value,
      });
      form.reset();
      await loadGuestbook();
      alert('¡Gracias por firmar el Guestbook!');
    } catch (err) { alert(err.message); }
  });
}

async function initIndex() {
  try {
    await Promise.all([loadFeed(), loadCategories(), loadGuestbook(), bumpVisits()]);
    hookGuestbookForm();
  } catch (e) {
    $('#feed').innerHTML = `<div class="alert alert-danger border border-dark">
      <i class="bi bi-exclamation-octagon"></i> No se pudo conectar con la API.
      Arranca el backend con <code>npm.cmd start</code> en la carpeta <code>backend</code>. (${esc(e.message)})
    </div>`;
  }
}

// ---------- Página de detalle (articulo.html) ----------

async function initArticle() {
  const slug = new URLSearchParams(location.search).get('slug');
  const root = $('#article');
  if (!slug) { root.innerHTML = '<div class="alert alert-warning">Falta el parámetro ?slug=</div>'; return; }

  try {
    const a = await api(`/articles/${encodeURIComponent(slug)}`);
    document.title = `${a.title} | RetroWeb Zine`;
    root.innerHTML = `
      <article class="card bg-white">
        <div class="card-header bg-warning border-bottom border-dark fw-bold">
          <span class="badge bg-danger">${esc(a.category)}</span>
        </div>
        <div class="card-body">
          <h1 class="h3 fw-bold">${esc(a.title)}</h1>
          <p class="text-muted small">
            <i class="bi bi-clock"></i> ${a.read_minutes} min | <i class="bi bi-person"></i> ${esc(a.author)} |
            <i class="bi bi-calendar"></i> ${fmtDate(a.created_at)}
          </p>
          <p class="fs-5">${esc(a.content)}</p>
          <button class="btn btn-outline-danger btn-sm" id="btn-like">
            <i class="bi bi-hand-thumbs-up"></i> ${a.likes} likes
          </button>
        </div>
      </article>

      <section class="card bg-white mt-4">
        <div class="card-header bg-dark text-white fw-bold"><i class="bi bi-chat-left-text"></i> Comentarios</div>
        <div class="card-body">
          <ul class="list-unstyled small" id="comments"></ul>
          <form id="comment-form">
            <div class="row g-2">
              <div class="col-md-4"><input name="nickname" class="form-control form-control-sm border-dark" placeholder="Tu nickname" required maxlength="40"></div>
              <div class="col-md-8"><input name="message" class="form-control form-control-sm border-dark" placeholder="Tu comentario..." required maxlength="1000"></div>
            </div>
            <button class="btn btn-dark btn-sm mt-2"><i class="bi bi-send"></i> Comentar</button>
          </form>
        </div>
      </section>`;

    $('#btn-like').addEventListener('click', async () => {
      const r = await api(`/articles/${encodeURIComponent(slug)}/like`, 'POST');
      $('#btn-like').innerHTML = `<i class="bi bi-hand-thumbs-up-fill"></i> ${r.likes} likes`;
    });

    const loadComments = async () => {
      const cs = await api(`/articles/${encodeURIComponent(slug)}/comments`);
      $('#comments').innerHTML = cs.map((c) => `
        <li class="border-bottom py-2">
          <strong class="text-primary">${esc(c.nickname)}</strong>
          <small class="text-muted">· ${fmtDate(c.created_at)}</small><br>${esc(c.message)}
        </li>`).join('') || '<li class="text-muted">Sé el primero en comentar...</li>';
    };
    await loadComments();

    $('#comment-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target;
      await api(`/articles/${encodeURIComponent(slug)}/comments`, 'POST', {
        nickname: f.nickname.value, message: f.message.value,
      });
      f.reset();
      await loadComments();
    });
  } catch (e) {
    root.innerHTML = `<div class="alert alert-danger border border-dark">${esc(e.message)}.
      <a href="index.html">Volver al inicio</a></div>`;
  }
}

// ---------- Arranque ----------

if ($('#feed')) initIndex();
if ($('#article')) initArticle();
