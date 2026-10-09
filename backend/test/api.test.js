const test = require('node:test');
const assert = require('node:assert');
const { openStore } = require('../src/store');
const { createApp } = require('../src/app');

test('API flow', async (t) => {
  const server = createApp(openStore(null)).listen(0);
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}/api`;
  const call = async (p, method = 'GET', body) => {
    const r = await fetch(base + p, {
      method, headers: { 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };

  assert.equal((await call('/articles', 'POST', { title: 'x' })).status, 400);
  const a = await call('/articles', 'POST', { title: 'Hola Mundo', content: 'texto', category: 'BASIC' });
  assert.equal(a.status, 201);
  assert.equal(a.data.slug, 'hola-mundo');
  assert.equal((await call('/articles?category=BASIC')).data.total, 1);
  assert.equal((await call('/articles/hola-mundo/like', 'POST')).data.likes, 1);
  assert.equal((await call('/articles/hola-mundo/comments', 'POST', { nickname: 'n', message: 'm' })).status, 201);
  assert.equal((await call('/articles/hola-mundo/comments')).data.length, 1);
  assert.equal((await call('/guestbook', 'POST', { nickname: 'n', message: 'm' })).status, 201);
  assert.equal((await call('/visits', 'POST')).data.visits, 1);
  assert.equal((await call('/articles/nope')).status, 404);
});
