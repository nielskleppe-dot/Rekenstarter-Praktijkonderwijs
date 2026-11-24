import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createDatabase, initializeSchema, seedPlan, PLAN_OWNER_ID, translateStatement, DATABASE_SCHEMA } from '../netlify/lib/database.mjs';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const pg = new PGlite();
await pg.waitReady;
// A PGlite instance is one real PostgreSQL connection. Serialize leases to model
// pg.Pool connections without allowing a test query into another transaction.
let tail = Promise.resolve(), acquired = 0, released = 0;
async function lease() {
  const before = tail;
  let release;
  tail = new Promise(resolve => { release = resolve; });
  await before;
  return release;
}
const execute = async (text, values) => {
  const result = await pg.query(text, values);
  return { rows: result.rows, rowCount: result.affectedRows ?? result.rows.length };
};
const pool = {
  async query(text, values = []) {
    const unlock = await lease();
    try { return await execute(text, values); }
    finally { unlock(); }
  },
  async connect() {
    const unlock = await lease();
    acquired++;
    let done = false;
    return {
      query: (text, values = []) => execute(text, values),
      release() { assert(!done, 'Release each connection once'); done = true; released++; unlock(); }
    };
  }
};
const DB = createDatabase(pool), seen = new Set(), originalPrepare = DB.prepare;
DB.prepare = sql => { seen.add(translateStatement(sql).text.replace(/\s+/g, ' ').trim()); return originalPrepare(sql); };

try {
  // The deploy migration and the reusable schema initializer must both work
  // against PostgreSQL, including a second initialization of an existing DB.
  const migration = await read('netlify/database/migrations/0001_rekenstart.sql');
  await pg.exec(migration);
  await initializeSchema(pool);
  await initializeSchema(pool);
  const normalizeSchema = text => text.replace(/\s+/g, '').replaceAll(';', '').toLowerCase();
  assert.equal(normalizeSchema(migration), normalizeSchema(DATABASE_SCHEMA.join(';')));

  const data = JSON.parse(await read('src/lesson-data.json'));
  data.images = {}; data.brand = {};
  const common = await read('src/common.js'), core = await read('src/card-core.js');
  const ai = await read('worker/ai.js'), cards = await read('worker/cards.js'), index = await read('worker/index.js');
  const app = new Function('DATA', 'ensureLessonData', 'lessonImageResponse', 'teachingPageResponse',
    common + '\n' + core + '\n' + ai + '\n' + cards + '\n' + index.replace('export default', 'const worker =') + '\nreturn {worker,baseSettings,validateCard};')(
    data, () => {}, () => null, () => new Response('fixture'));
  const settings = app.baseSettings(data);
  await assert.rejects(seedPlan(DB, { settings }), /D1_DATABASE_ERROR/, 'Ownership must be explicit');
  const seeded = await seedPlan(DB, { ownerId: PLAN_OWNER_ID, settings });
  assert.equal(seeded.owner_id, PLAN_OWNER_ID);
  await seedPlan(DB, { ownerId: 'visitor-must-not-take-over', settings: { changed: true } });
  assert.equal((await DB.prepare('SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1').first()).owner_id, PLAN_OWNER_ID);

  const env = { DB, AI_PROVIDER: 'gemini', AI_CONNECTION_SECRET: '0123456789abcdef'.repeat(4) };
  const send = async (path, { body, user = 'teacher-a', method = body ? 'POST' : 'GET', origin = 'https://test.example' } = {}) => {
    const headers = { origin };
    if (user !== null) headers['oai-authenticated-user-id'] = user;
    if (body) headers['content-type'] = 'application/json';
    const response = await app.worker.fetch(new Request('https://test.example' + path, { method, headers, body: body ? JSON.stringify(body) : undefined }), env);
    return { status: response.status, data: await response.json() };
  };

  let response = await send('/api/state');
  assert.equal(response.status, 200); assert.equal(response.data.shared, true); assert.equal(response.data.canEdit, false);
  assert.equal((await send('/api/state', { user: null })).data.signedIn, false);
  assert.equal((await send('/api/state', { method: 'PUT', body: { settings, revision: 0 } })).status, 403);
  const changed = { ...settings, cancelled: ['1-ma'] };
  response = await send('/api/state', { user: PLAN_OWNER_ID, method: 'PUT', body: { settings: changed, revision: 0 } });
  assert.equal(response.status, 200); assert.equal(response.data.revision, 1);
  assert.deepEqual((await send('/api/state')).data.settings.cancelled, ['1-ma']);
  const concurrentPlans = await Promise.all([1, 2].map(() => send('/api/state', { user: PLAN_OWNER_ID, method: 'PUT', body: { settings: changed, revision: 1 } })));
  assert.deepEqual(concurrentPlans.map(item => item.status).sort(), [200, 409], 'A concurrent plan update cannot overwrite the newer revision');

  const examples = JSON.parse(await read('src/workcard-examples.json'));
  const card = { ...structuredClone(examples[0]), id: 'kaart-postgres-test', revision: 0, title: "Schroeven; SELECT '?' -- netjes sorteren" };
  assert.equal((await send('/api/cards')).data.cards.length, 0);
  response = await send('/api/cards', { body: { card, expectedRevision: 0 } });
  assert.equal(response.status, 200); assert.equal(response.data.revision, 1);
  const listed = (await send('/api/cards')).data.cards;
  assert.equal(listed.length, 1); assert.equal(listed[0].title, card.title); assert.equal(listed[0].grade, card.grade);
  assert.equal((await send('/api/cards', { user: 'teacher-b' })).data.cards.length, 0);
  assert.equal((await send('/api/cards/' + card.id, { user: 'teacher-b' })).status, 404);
  assert.equal((await send('/api/cards', { user: 'teacher-b', body: { card, expectedRevision: 1 } })).status, 403);
  assert.equal((await send('/api/cards', { body: { card, expectedRevision: 1 }, origin: 'https://elsewhere.example' })).status, 403);
  assert.equal((await send('/api/cards', { body: { card, expectedRevision: 0 } })).status, 409);
  const updated = { ...card, title: 'Een aangepaste werkkaart' };
  response = await send('/api/cards', { body: { card: updated, expectedRevision: 1 } });
  assert.equal(response.status, 200); assert.equal(response.data.revision, 2);
  const concurrentCards = await Promise.all([1, 2].map(number => send('/api/cards', { body: { card: { ...updated, title: 'Versie ' + number }, expectedRevision: 2 } })));
  assert.deepEqual(concurrentCards.map(item => item.status).sort(), [200, 409], 'A concurrent workcard update cannot overwrite a newer revision');
  assert.equal((await send('/api/cards/' + card.id + '?history=1')).data.versions.length, 3);
  assert.equal((await send('/api/cards/' + card.id + '?revision=1')).data.card.title, card.title);
  assert.equal((await send('/api/cards/' + card.id + '?revision=999')).status, 404);

  // Use actual worker AI/storage code with simulated Google responses only.
  const nativeFetch = globalThis.fetch, calls = [];
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /^https:\/\/generativelanguage\.googleapis\.com\//);
    calls.push({ url, body: JSON.parse(options.body) });
    const input = calls.at(-1).body.contents[0].parts[0].text;
    const output = /Antwoord met: Verbonden/.test(input) ? 'Verbonden' : /centraalRekendoel/.test(input) ? 'Laat leerlingen de maat hardop noemen.' : JSON.stringify({ title: 'Rekenen op de werkplek', context: 'Je bekijkt het materiaal voor de klus.', tip: 'Laat leerlingen hun aanpak uitleggen.' });
    return Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: output }] } }] });
  };
  try {
    assert.equal((await send('/api/ai-connection')).status, 403);
    response = await send('/api/ai-connection', { user: PLAN_OWNER_ID });
    assert.equal(response.status, 200); assert.equal(response.data.revision, 0);
    response = await send('/api/ai-connection', { user: PLAN_OWNER_ID, body: { key: 'local-test-gemini-key-never-real', freeTier: true, revision: 0 } });
    assert.equal(response.status, 200); assert.equal(response.data.revision, 1);
    const encrypted = await pool.query('SELECT owner_id, ciphertext, iv FROM ai_connection WHERE id=1');
    assert.equal(encrypted.rows[0].owner_id, PLAN_OWNER_ID); assert(!encrypted.rows[0].ciphertext.includes('local-test-gemini-key-never-real'));
    assert.equal((await send('/api/state')).data.liveCoach, true);
    assert.equal((await send('/api/ai-connection', { user: PLAN_OWNER_ID, body: { key: 'local-test-gemini-key-never-real', freeTier: true, revision: 0 } })).status, 409);
    response = await send('/api/ai-connection', { user: PLAN_OWNER_ID, body: { key: 'local-test-gemini-key-never-real', freeTier: true, revision: 1 } });
    assert.equal(response.status, 200); assert.equal(response.data.revision, 2);
    response = await send('/api/assistant', { body: { mode: 'chat', question: 'Hoe maak ik de rekenvraag duidelijk?', card: updated } });
    assert.equal(response.status, 200); assert.match(response.data.message, /hardop/);
    const lesson = data.years[0][0].lessons[0];
    response = await send('/api/coach', { body: { lesson: lesson.id, sector: data.sectors[0].id, question: 'Gebruik een voorbeeld van de stage.' } });
    assert.equal(response.status, 200); assert.equal(response.data.title, 'Rekenen op de werkplek');
    assert.equal(calls.length, 4);
  } finally { globalThis.fetch = nativeFetch; }

  const quota = 'INSERT INTO rekenstart_quota(user_id,hour,used) VALUES (?,?,1) ON CONFLICT(user_id,hour) DO UPDATE SET used=used+1 WHERE used<10 RETURNING used';
  const attempts = await Promise.all(Array.from({ length: 17 }, () => DB.prepare(quota).bind('quota-concurrent', 888).first()));
  assert.equal(attempts.filter(Boolean).length, 10, 'Concurrent usage never exceeds ten AI requests');
  assert.deepEqual(attempts.filter(Boolean).map(item => item.used).sort((a, b) => a - b), [1,2,3,4,5,6,7,8,9,10]);

  // A failure in the history statement must roll back the preceding workcard.
  const insert = 'INSERT OR IGNORE INTO workcards(id,owner_id,revision,payload,updated_at) VALUES (?,?,1,?,?)';
  await assert.rejects(DB.batch([
    DB.prepare(insert).bind('rollback-card', 'teacher-a', '{}', '2026-11-24T00:00:00Z'),
    DB.prepare('INSERT INTO workcard_versions(card_id,revision,payload,created_at) VALUES (?,1,?,?)').bind('missing-parent', '{}', '2026-11-24T00:00:00Z')
  ]), /D1_DATABASE_ERROR/);
  assert.equal((await pool.query("SELECT id FROM workcards WHERE id='rollback-card'")).rows.length, 0);
  assert.equal((await pool.query('SELECT COUNT(*)::integer AS n FROM workcards')).rows[0].n, 1);

  const literal = await DB.prepare("SELECT '?' AS example, ? AS value /* ? must not bind */ -- ?\n").bind('bound-value').first();
  assert.deepEqual(literal, { example: '?', value: 'bound-value' });
  assert.equal(await DB.prepare('SELECT 1 AS value').first('value'), 1);
  assert.throws(() => DB.prepare('SELECT ? AS value').bind(), /D1_DATABASE_ERROR/);
  await assert.rejects(DB.prepare('SELECT ? AS value').first(), /D1_DATABASE_ERROR/);
  assert.throws(() => DB.prepare('SELECT 1; DROP TABLE workcards'), /D1_DATABASE_ERROR/);
  assert.throws(() => DB.prepare("SELECT json_extract(payload,'$.bad-field') FROM workcards"), /D1_DATABASE_ERROR/);
  await assert.rejects(createDatabase({ query: async () => { throw Error('secret-database-url'); }, connect: pool.connect }).prepare('SELECT 1').first(), error => error.message === 'D1_DATABASE_ERROR' && !error.message.includes('secret'));
  assert.equal(acquired, released, 'Every transaction lease is released, including errors');

  const sourceQueries = new Set();
  for (const source of [index, cards, ai]) for (const match of source.matchAll(/\.prepare\(("(?:[^"\\]|\\.)*")\)/g)) sourceQueries.add(translateStatement(JSON.parse(match[1])).text.replace(/\s+/g, ' ').trim());
  for (const sql of sourceQueries) assert(seen.has(sql), 'Exercise every original worker database query on PostgreSQL: ' + sql);
  console.log('PASS: real PostgreSQL schema/migration; ' + sourceQueries.size + ' original SQL statements; plan ownership, teacher isolation, card/version transactions, concurrent revision conflicts, atomic ten-request quota, encrypted Gemini setup and sanitized failures. No external AI calls.');
} finally { await pg.close(); }
