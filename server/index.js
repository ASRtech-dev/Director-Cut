import express from 'express';
import cors from 'cors';
import { timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import { dirname, isAbsolute, join, relative, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEFAULT_ALLOWED_ORIGINS = new Set([
  'http://localhost:1420',
  'http://127.0.0.1:1420',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
]);

/**
 * Resolve a snapshot path strictly within `baseDir`, blocking path traversal and absolute paths.
 */
export function resolveSnapshotPath(baseDir, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim() || relativePath.includes('\0')) {
    throw new Error('Invalid snapshot path');
  }
  const normalizedInput = relativePath.trim();
  if (
    isAbsolute(normalizedInput) ||
    normalizedInput.startsWith('/') ||
    normalizedInput.startsWith('\\') ||
    /^[A-Za-z]:/.test(normalizedInput)
  ) {
    throw new Error('Absolute snapshot paths are not allowed');
  }

  const resolvedBase = resolve(baseDir);
  const resolvedTarget = resolve(resolvedBase, normalizedInput);
  const rel = relative(resolvedBase, resolvedTarget);

  if (!rel || rel === '..' || rel.startsWith('..\\') || rel.startsWith('../') || isAbsolute(rel)) {
    throw new Error('Path traversal detected');
  }
  return resolvedTarget;
}

/**
 * Return SQL stripped of quoted literals and comments for structural safety checks.
 */
function stripSqlLiteralsAndComments(sql) {
  let out = '';
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    const next = sql[i + 1];

    if (ch === '-' && next === '-') {
      i += 2;
      while (i < sql.length && sql[i] !== '\n') i++;
      out += ' ';
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
      i += 2;
      out += ' ';
      continue;
    }
    if (ch === '\'' || ch === '"') {
      const quote = ch;
      i++;
      while (i < sql.length) {
        if (sql[i] === quote && sql[i + 1] === quote) {
          i += 2;
          continue;
        }
        if (sql[i] === quote) {
          i++;
          break;
        }
        i++;
      }
      out += ' ';
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

/**
 * Validate SQL queries submitted to the sync server to prevent stacked queries and dangerous pragmas.
 */
export function validateSqlQuery(query, mode = 'execute') {
  if (typeof query !== 'string' || !query.trim()) {
    throw new Error('Query is required');
  }

  const structural = stripSqlLiteralsAndComments(query).trim();
  if (!structural) {
    throw new Error('Query is empty');
  }

  const semiIndex = structural.indexOf(';');
  if (semiIndex !== -1 && structural.slice(semiIndex + 1).trim().length > 0) {
    throw new Error('Multiple SQL statements in a single request are not allowed');
  }

  if (/\b(ATTACH|DETACH|LOAD_EXTENSION)\b/i.test(structural) || /\bVACUUM\s+INTO\b/i.test(structural)) {
    throw new Error('Disallowed SQL directive');
  }

  if (mode === 'select' && !/^(SELECT|WITH)\b/i.test(structural)) {
    throw new Error('Select endpoint only permits SELECT or WITH queries');
  }
}

export function isOriginAllowed(origin, extraOrigins = []) {
  if (!origin) return true;
  if (DEFAULT_ALLOWED_ORIGINS.has(origin)) return true;
  return extraOrigins.includes(origin);
}

function safeTokenEquals(provided, expected) {
  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function createApp({
  dbAll,
  dbRun,
  snapshotsDir = join(__dirname, 'snapshots'),
  authToken = process.env.SERVER_AUTH_TOKEN || '',
  corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
} = {}) {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (isOriginAllowed(origin, corsOrigins)) {
          callback(null, true);
        } else {
          callback(new Error('Origin not allowed by CORS'));
        }
      },
    })
  );
  app.use(express.json({ limit: '50mb' }));

  const requireAuth = (req, res, next) => {
    if (!authToken) return next();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token || !safeTokenEquals(token, authToken)) {
      return res.status(401).json({ error: 'Unauthorized: missing or invalid bearer token' });
    }
    return next();
  };

  // 1. Health Status Route
  app.get('/api/status', async (_req, res) => {
    try {
      const result = await dbAll('SELECT COUNT(*) as count FROM workflow_step_definitions');
      res.json({ status: 'ok', stepsCount: result[0].count, authRequired: Boolean(authToken) });
    } catch (err) {
      res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // 2. Generic Select Endpoint
  app.post('/api/db/select', requireAuth, async (req, res) => {
    const { query, params } = req.body || {};
    if (params !== undefined && !Array.isArray(params)) {
      return res.status(400).json({ error: 'Params must be an array' });
    }
    try {
      validateSqlQuery(query, 'select');
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
    }

    try {
      const rows = await dbAll(query, params || []);
      res.json(rows);
    } catch (err) {
      console.error('[DB Select Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Generic Execute Endpoint
  app.post('/api/db/execute', requireAuth, async (req, res) => {
    const { query, params } = req.body || {};
    if (params !== undefined && !Array.isArray(params)) {
      return res.status(400).json({ error: 'Params must be an array' });
    }
    try {
      validateSqlQuery(query, 'execute');
    } catch (validationErr) {
      return res.status(400).json({ error: validationErr.message });
    }

    try {
      const result = await dbRun(query, params || []);
      res.json({
        lastInsertId: result.lastID,
        rowsAffected: result.changes,
      });
    } catch (err) {
      console.error('[DB Execute Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Save Snapshot Endpoint
  app.post('/api/snapshots', requireAuth, async (req, res) => {
    const { path: relativePath, content } = req.body || {};
    if (!relativePath || typeof content !== 'string') {
      return res.status(400).json({ error: 'Valid path and string content are required' });
    }

    let fullPath;
    try {
      fullPath = resolveSnapshotPath(snapshotsDir, relativePath);
    } catch (pathErr) {
      return res.status(400).json({ error: pathErr.message });
    }

    const targetDir = dirname(fullPath);

    try {
      await fs.mkdir(targetDir, { recursive: true });
      await fs.writeFile(fullPath, content, 'utf8');
      console.log(`[Server Snapshot] Saved: ${relative(snapshotsDir, fullPath)}`);
      res.json({ success: true, path: relativePath });
    } catch (err) {
      console.error('[Server Snapshot Save Error]:', err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Read Snapshot Endpoint
  app.get('/api/snapshots', requireAuth, async (req, res) => {
    const { path: relativePath } = req.query;
    if (!relativePath || typeof relativePath !== 'string') {
      return res.status(400).json({ error: 'Path is required' });
    }

    let fullPath;
    try {
      fullPath = resolveSnapshotPath(snapshotsDir, relativePath);
    } catch (pathErr) {
      return res.status(400).json({ error: pathErr.message });
    }

    try {
      const content = await fs.readFile(fullPath, 'utf8');
      res.send(content);
    } catch (_err) {
      console.warn('[Server Snapshot Read Error] File not found or unreadable');
      res.status(404).send('Snapshot file not found.');
    }
  });

  return app;
}

const isEntrypoint =
  process.argv[1] && resolve(__filename).toLowerCase() === resolve(process.argv[1]).toLowerCase();

if (isEntrypoint) {
  const { initDb, dbAll, dbRun } = await import('./database.js');
  await initDb();

  const PORT = process.env.PORT || 5000;
  const allowLan = process.argv.includes('--lan');
  const HOST = process.env.HOST || (allowLan ? '0.0.0.0' : '127.0.0.1');
  const app = createApp({ dbAll, dbRun });

  app.listen(PORT, HOST, () => {
    console.log('=======================================================');
    console.log('Director Cut Sync Server is running!');
    console.log(`  Bind Address: http://${HOST}:${PORT}`);
    if (HOST === '127.0.0.1') {
      console.log('  LAN Wi-Fi mode: run `npm run start:lan` or set HOST=0.0.0.0');
    }
    if (!process.env.SERVER_AUTH_TOKEN) {
      console.log('  Tip: set SERVER_AUTH_TOKEN to require Bearer auth on API routes');
    }
    console.log('=======================================================');
  });
}
