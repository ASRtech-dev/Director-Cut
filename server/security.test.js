import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { Duplex } from 'node:stream';
import { createApp, resolveSnapshotPath, validateSqlQuery, isOriginAllowed } from './index.js';

function invokeApp(app, { method = 'GET', url = '/', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const dummySocket = new Duplex({
      read() {},
      write(_chunk, _enc, cb) {
        cb();
      },
    });
    dummySocket.remoteAddress = '127.0.0.1';

    const req = new http.IncomingMessage(dummySocket);
    req.method = method;
    req.url = url;
    for (const [k, v] of Object.entries(headers)) {
      req.headers[k.toLowerCase()] = v;
    }

    const payload = body !== undefined ? Buffer.from(JSON.stringify(body), 'utf8') : null;
    if (payload) {
      req.headers['content-type'] = 'application/json';
      req.headers['content-length'] = String(payload.length);
    }

    const res = new http.ServerResponse(req);
    const chunks = [];
    res.assignSocket(dummySocket);
    res.write = (chunk, encoding, cb) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      if (typeof cb === 'function') cb();
      return true;
    };
    res.end = (chunk, encoding, cb) => {
      if (chunk && typeof chunk !== 'function') {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      }
      if (typeof chunk === 'function') chunk();
      if (typeof cb === 'function') cb();
      const raw = Buffer.concat(chunks).toString('utf8');
      const headerEnd = raw.indexOf('\r\n\r\n');
      const text = headerEnd !== -1 ? raw.slice(headerEnd + 4) : raw;
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        // non-JSON response
      }
      setImmediate(() => {
        resolve({ status: res.statusCode, headers: res.getHeaders(), text, json });
      });
      return res;
    };

    app.handle(req, res, (err) => {
      if (err) reject(err);
    });

    setImmediate(() => {
      if (payload) req.push(payload);
      req.push(null);
    });
  });
}

test('resolveSnapshotPath allows nested relative paths inside base directory', () => {
  const base = path.join(os.tmpdir(), 'director-cut-snapshots-test');
  const resolved = resolveSnapshotPath(base, 'episodes/EP001/S01/EP001_S01_brief_v001.md');
  assert.ok(resolved.startsWith(path.resolve(base) + path.sep));
});

test('resolveSnapshotPath blocks directory traversal, null bytes, and absolute paths', () => {
  const base = path.join(os.tmpdir(), 'director-cut-snapshots-test');
  assert.throws(() => resolveSnapshotPath(base, '../director_cut.db'), /traversal/i);
  assert.throws(() => resolveSnapshotPath(base, 'episodes/../../secret.txt'), /traversal/i);
  assert.throws(() => resolveSnapshotPath(base, '/etc/passwd'), /absolute/i);
  assert.throws(() => resolveSnapshotPath(base, 'C:\\Windows\\win.ini'), /absolute/i);
  assert.throws(() => resolveSnapshotPath(base, 'file\0.md'), /invalid/i);
});

test('validateSqlQuery enforces read-only select and blocks stacked or dangerous statements', () => {
  assert.doesNotThrow(() => validateSqlQuery('SELECT * FROM episodes WHERE id = $1', 'select'));
  assert.doesNotThrow(() => validateSqlQuery('WITH cte AS (SELECT 1) SELECT * FROM cte;', 'select'));
  assert.doesNotThrow(() => validateSqlQuery("INSERT INTO episodes (title) VALUES ('a;b');", 'execute'));

  assert.throws(() => validateSqlQuery('DELETE FROM episodes', 'select'), /SELECT/i);
  assert.throws(() => validateSqlQuery('SELECT 1; DROP TABLE episodes', 'select'), /Multiple SQL/i);
  assert.throws(() => validateSqlQuery('INSERT INTO x VALUES (1); DROP TABLE x', 'execute'), /Multiple SQL/i);
  assert.throws(() => validateSqlQuery("ATTACH DATABASE 'evil.db' AS e", 'execute'), /Disallowed/i);
});

test('isOriginAllowed permits desktop/local origins and blocks arbitrary web origins', () => {
  assert.equal(isOriginAllowed(undefined), true);
  assert.equal(isOriginAllowed('http://localhost:1420'), true);
  assert.equal(isOriginAllowed('tauri://localhost'), true);
  assert.equal(isOriginAllowed('https://evil.example.com'), false);
  assert.equal(isOriginAllowed('https://custom.local', ['https://custom.local']), true);
});

test('HTTP endpoints enforce bearer auth, traversal protection, and SQL validation', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dc-server-test-'));
  const app = createApp({
    snapshotsDir: tmpDir,
    authToken: 'test-secret-token',
    dbAll: async () => [{ count: 16 }],
    dbRun: async () => ({ lastID: 1, changes: 1 }),
  });

  try {
    const statusRes = await invokeApp(app, { method: 'GET', url: '/api/status' });
    assert.equal(statusRes.status, 200);
    assert.equal(statusRes.json.authRequired, true);

    const unauthRes = await invokeApp(app, {
      method: 'POST',
      url: '/api/snapshots',
      body: { path: 'episodes/EP001/S01/test.md', content: 'hello' },
    });
    assert.equal(unauthRes.status, 401);

    const traversalRes = await invokeApp(app, {
      method: 'POST',
      url: '/api/snapshots',
      headers: { Authorization: 'Bearer test-secret-token' },
      body: { path: '../../outside.txt', content: 'pwned' },
    });
    assert.equal(traversalRes.status, 400);

    const saveRes = await invokeApp(app, {
      method: 'POST',
      url: '/api/snapshots',
      headers: { Authorization: 'Bearer test-secret-token' },
      body: { path: 'episodes/EP001/S01/test.md', content: '# OK' },
    });
    assert.equal(saveRes.status, 200);

    const readRes = await invokeApp(app, {
      method: 'GET',
      url: `/api/snapshots?path=${encodeURIComponent('episodes/EP001/S01/test.md')}`,
      headers: { Authorization: 'Bearer test-secret-token' },
    });
    assert.equal(readRes.status, 200);
    assert.equal(readRes.text, '# OK');

    const badSqlRes = await invokeApp(app, {
      method: 'POST',
      url: '/api/db/select',
      headers: { Authorization: 'Bearer test-secret-token' },
      body: { query: 'SELECT 1; DELETE FROM episodes' },
    });
    assert.equal(badSqlRes.status, 400);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
});
