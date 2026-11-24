// The lesson APIs use a small D1-shaped interface. Keep their ownership and
// revision predicates intact while executing on Netlify's PostgreSQL pool.
export const PLAN_OWNER_ID = 'netlify-admin';

export const DATABASE_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rekenstart_plan (
    id INTEGER PRIMARY KEY CHECK (id = 1), owner_id TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0), payload TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS rekenstart_quota (
    user_id TEXT NOT NULL, hour INTEGER NOT NULL, used INTEGER NOT NULL CHECK (used >= 0),
    PRIMARY KEY (user_id, hour)
  )`,
  `CREATE TABLE IF NOT EXISTS workcards (
    id TEXT PRIMARY KEY, owner_id TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
    payload TEXT NOT NULL, updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS workcards_owner_updated ON workcards(owner_id, updated_at)`,
  `CREATE TABLE IF NOT EXISTS workcard_versions (
    card_id TEXT NOT NULL REFERENCES workcards(id), revision INTEGER NOT NULL CHECK (revision >= 1),
    payload TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (card_id, revision)
  )`,
  `CREATE TABLE IF NOT EXISTS ai_connection (
    id INTEGER PRIMARY KEY CHECK (id = 1), owner_id TEXT NOT NULL,
    ciphertext TEXT NOT NULL, iv TEXT NOT NULL,
    revision INTEGER NOT NULL CHECK (revision >= 1), verified_at TEXT NOT NULL,
    free_tier_confirmed INTEGER NOT NULL CHECK (free_tier_confirmed = 1)
  )`
];

function databaseError(cause) {
  // Existing API handling recognizes this prefix. SQL, credentials, provider
  // errors and user payloads never become an HTTP response or a log message.
  const error = new Error('D1_DATABASE_ERROR');
  error.code = 'D1_DATABASE_ERROR';
  if (cause) Object.defineProperty(error, 'cause', { value: cause });
  return error;
}

// Tokens retain offsets so rewriting SQL syntax cannot touch a quoted value,
// quoted identifier, comment, or a parameter's separately bound value.
function tokenize(sql) {
  const tokens = [];
  for (let offset = 0; offset < sql.length;) {
    const start = offset, first = sql[offset];
    let kind = 'symbol';
    if (/\s/.test(first)) {
      while (offset < sql.length && /\s/.test(sql[offset])) offset++;
      kind = 'space';
    } else if (sql.startsWith('--', offset)) {
      offset = sql.indexOf('\n', offset + 2);
      if (offset === -1) offset = sql.length;
      kind = 'comment';
    } else if (sql.startsWith('/*', offset)) {
      const end = sql.indexOf('*/', offset + 2);
      if (end === -1) throw databaseError();
      offset = end + 2;
      kind = 'comment';
    } else if (first === "'" || first === '"') {
      const quote = first;
      offset++;
      let closed = false;
      while (offset < sql.length) {
        if (sql[offset++] !== quote) continue;
        if (sql[offset] === quote) { offset++; continue; }
        closed = true;
        break;
      }
      if (!closed) throw databaseError();
      kind = quote === "'" ? 'string' : 'identifier';
    } else if (/[a-z_]/i.test(first)) {
      offset++;
      while (offset < sql.length && /[a-z0-9_$]/i.test(sql[offset])) offset++;
      kind = 'word';
    } else {
      offset++;
    }
    const text = sql.slice(start, offset);
    tokens.push({ start, end: offset, text, kind, upper: kind === 'word' ? text.toUpperCase() : text });
  }
  return tokens;
}

export function translateStatement(sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw databaseError();
  const tokens = tokenize(sql), significant = tokens.filter(t => t.kind !== 'space' && t.kind !== 'comment');
  const command = significant[0]?.upper;
  if (!['SELECT', 'INSERT', 'UPDATE'].includes(command)) throw databaseError();
  const semicolons = significant.filter(t => t.text === ';');
  if (semicolons.length && (semicolons.length !== 1 || significant.at(-1).text !== ';')) throw databaseError();
  const replacements = [];
  const replace = (start, end, value) => replacements.push({ start, end, value });
  if (semicolons.length) replace(semicolons[0].start, semicolons[0].end, '');
  let parameterCount = 0;
  for (const token of significant) if (token.text === '?') replace(token.start, token.end, '$' + (++parameterCount));

  const ignore = command === 'INSERT' && significant[1]?.upper === 'OR' && significant[2]?.upper === 'IGNORE';
  if (ignore) {
    if (significant.some((token, index) => token.upper === 'ON' && significant[index + 1]?.upper === 'CONFLICT')) throw databaseError();
    replace(significant[1].start, significant[2].end, '');
    const returning = significant.find(token => token.upper === 'RETURNING');
    const end = returning?.start ?? semicolons[0]?.start ?? sql.length;
    replace(end, end, ' ON CONFLICT DO NOTHING ');
  }

  for (let index = 0; index < significant.length; index++) {
    const group = significant.slice(index, index + 6);
    if (group[0]?.upper !== 'JSON_EXTRACT') continue;
    if (group.length !== 6 || group[1].text !== '(' || group[2].upper !== 'PAYLOAD' || group[3].text !== ',' || group[4].kind !== 'string' || group[5].text !== ')') throw databaseError();
    const field = group[4].text.match(/^'\$\.([a-z_][a-z0-9_]*)'$/i)?.[1];
    if (!field) throw databaseError();
    replace(group[0].start, group[5].end, `(payload::jsonb ->> '${field}')`);
    index += 5;
  }

  // In PostgreSQL an ON CONFLICT upsert has both the existing and EXCLUDED
  // columns in scope. Qualify the old value so quota increments stay atomic.
  const quotaInsert = command === 'INSERT' && significant.some((token, index) => token.upper === 'INTO' && significant[index + 1]?.upper === 'REKENSTART_QUOTA');
  if (quotaInsert) {
    for (let index = 0; index < significant.length; index++) {
      const token = significant[index], previous = significant[index - 1];
      if (token.upper === 'USED' && ['=', 'WHERE', 'RETURNING'].includes(previous?.upper)) replace(token.start, token.end, 'rekenstart_quota.used');
    }
  }

  replacements.sort((a, b) => b.start - a.start || b.end - a.end);
  let text = sql, lastStart = Infinity;
  for (const replacement of replacements) {
    if (replacement.end > lastStart) throw databaseError();
    text = text.slice(0, replacement.start) + replacement.value + text.slice(replacement.end);
    lastStart = replacement.start;
  }
  return { text: text.trim(), parameterCount, command };
}

function normalize(result, command) {
  return {
    success: true,
    results: result?.rows ?? [],
    meta: { changes: command === 'SELECT' ? 0 : Number(result?.rowCount ?? 0) }
  };
}

class PreparedStatement {
  constructor(database, compiled, values = []) {
    this.database = database;
    this.compiled = compiled;
    this.values = values;
  }
  bind(...values) {
    if (values.length !== this.compiled.parameterCount || values.some(value => value === undefined)) throw databaseError();
    return new PreparedStatement(this.database, this.compiled, values);
  }
  validate() {
    if (this.values.length !== this.compiled.parameterCount) throw databaseError();
  }
  async execute(client) {
    this.validate();
    const result = await client.query(this.compiled.text, this.values);
    return normalize(result, this.compiled.command);
  }
  async all() {
    try { return await this.execute(this.database.pool); }
    catch (error) { throw databaseError(error); }
  }
  async run() { return this.all(); }
  async first(column) {
    const row = (await this.all()).results[0] ?? null;
    return column === undefined ? row : row?.[column] ?? null;
  }
}

export function createDatabase(pool) {
  if (!pool || typeof pool.query !== 'function' || typeof pool.connect !== 'function') throw databaseError();
  const database = {
    pool,
    prepare(sql) { return new PreparedStatement(database, translateStatement(sql)); },
    async batch(statements) {
      if (!Array.isArray(statements) || statements.some(statement => !(statement instanceof PreparedStatement) || statement.database !== database)) throw databaseError();
      for (const statement of statements) statement.validate();
      if (!statements.length) return [];
      let client, begun = false;
      try {
        client = await pool.connect();
        await client.query('BEGIN');
        begun = true;
        const results = [];
        for (const statement of statements) results.push(await statement.execute(client));
        await client.query('COMMIT');
        begun = false;
        return results;
      } catch (error) {
        if (begun) { try { await client.query('ROLLBACK'); } catch {} }
        throw databaseError(error);
      } finally {
        client?.release();
      }
    }
  };
  return database;
}

export async function initializeSchema(pool) {
  let client, begun = false;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    begun = true;
    for (const statement of DATABASE_SCHEMA) await client.query(statement);
    await client.query('COMMIT');
    begun = false;
  } catch (error) {
    if (begun) { try { await client.query('ROLLBACK'); } catch {} }
    throw databaseError(error);
  } finally {
    client?.release();
  }
}

export async function seedPlan(database, { ownerId, settings } = {}) {
  if (typeof ownerId !== 'string' || !ownerId.trim() || !settings || typeof settings !== 'object' || Array.isArray(settings)) throw databaseError();
  // The server passes its explicitly configured administrator identity. Never
  // derive ownership from whichever visitor first happens to request the plan.
  await database.prepare('INSERT OR IGNORE INTO rekenstart_plan (id,owner_id,revision,payload) VALUES (1,?,0,?)').bind(ownerId, JSON.stringify(settings)).run();
  return database.prepare('SELECT owner_id,revision,payload FROM rekenstart_plan WHERE id = 1').first();
}
