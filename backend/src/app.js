const express = require('express');
const cors = require('cors');
const path = require('node:path');

const slugify = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const clean = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const now = () => new Date().toISOString();
const summary = ({ content, ...rest }) => rest;

function createApp(store) {
  const { data } = store;
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));

  const bad = (res, msg) => res.status(400).json({ error: msg });
  const notFound = (res) => res.status(404).json({ error: 'Artículo no encontrado' });
  const find = (slug) => data.articles.find((a) => a.slug === slug);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  // Artículos
  app.get('/api/articles', (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 5));
    const category = clean(req.query.category, 60);
    const q = clean(req.query.q, 100).toLowerCase();
    const list = data.articles
      .filter((a) => !category || a.category === category)
      .filter((a) => !q || a.title.toLowerCase().includes(q) || a.excerpt.toLowerCase().includes(q))
      .sort((a, b) => b.id - a.id);
    res.json({
      items: list.slice((page - 1) * limit, page * limit).map(summary),
      page, limit, total: list.length, pages: Math.ceil(list.length / limit),
    });
  });

  app.get('/api/categories', (_req, res) => {
    const counts = {};
    data.articles.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
    res.json(Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count));
  });

  app.get('/api/articles/:slug', (req, res) => {
    const a = find(req.params.slug);
    return a ? res.json(a) : notFound(res);
  });

  app.post('/api/articles', (req, res) => {
    const title = clean(req.body.title, 200);
    const content = clean(req.body.content, 50000);
    const category = clean(req.body.category, 60);
    if (!title || !content || !category) return bad(res, 'title, content y category son obligatorios');
    let slug = slugify(title) || 'articulo';
    if (find(slug)) slug += `-${Date.now().toString(36)}`;
    const article = {
      id: store.nextId(), slug, title, content, category,
      excerpt: clean(req.body.excerpt, 400) || content.slice(0, 200),
      author: clean(req.body.author, 60) || 'Archivero_Digital',
      read_minutes: Math.max(1, Math.ceil(content.split(/\s+/).length / 200)),
      likes: 0, created_at: now(),
    };
    data.articles.push(article);
    store.save();
    res.status(201).json(article);
  });

  app.post('/api/articles/:slug/like', (req, res) => {
    const a = find(req.params.slug);
    if (!a) return notFound(res);
    a.likes++;
    store.save();
    res.json({ slug: a.slug, likes: a.likes });
  });

  // Comentarios de un artículo
  app.get('/api/articles/:slug/comments', (req, res) => {
    const a = find(req.params.slug);
    if (!a) return notFound(res);
    res.json(data.comments.filter((c) => c.article_id === a.id).sort((x, y) => y.id - x.id));
  });

  app.post('/api/articles/:slug/comments', (req, res) => {
    const a = find(req.params.slug);
    if (!a) return notFound(res);
    const nickname = clean(req.body.nickname, 40);
    const message = clean(req.body.message, 1000);
    if (!nickname || !message) return bad(res, 'nickname y message son obligatorios');
    const c = { id: store.nextId(), article_id: a.id, nickname, message, created_at: now() };
    data.comments.push(c);
    store.save();
    res.status(201).json(c);
  });

  // Libro de visitas
  app.get('/api/guestbook', (_req, res) => {
    res.json([...data.guestbook].sort((a, b) => b.id - a.id).slice(0, 100));
  });

  app.post('/api/guestbook', (req, res) => {
    const nickname = clean(req.body.nickname, 40);
    const message = clean(req.body.message, 500);
    if (!nickname || !message) return bad(res, 'nickname y message son obligatorios');
    const entry = { id: store.nextId(), nickname, message, created_at: now() };
    data.guestbook.push(entry);
    store.save();
    res.status(201).json(entry);
  });

  // Contador de visitas
  app.get('/api/visits', (_req, res) => res.json({ visits: data.visits }));
  app.post('/api/visits', (_req, res) => {
    data.visits++;
    store.save();
    res.json({ visits: data.visits });
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

  // Sirve solo el frontend (no el backend ni data.json)
  const root = path.join(__dirname, '..', '..');
  app.use('/css', express.static(path.join(root, 'css')));
  app.use('/js', express.static(path.join(root, 'js')));
  app.get(['/', '/index.html'], (_req, res) => res.sendFile(path.join(root, 'index.html')));
  app.get('/articulo.html', (_req, res) => res.sendFile(path.join(root, 'articulo.html')));
  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return bad(res, 'JSON inválido');
    console.error(err);
    res.status(500).json({ error: 'Error interno' });
  });

  return app;
}

module.exports = { createApp };
