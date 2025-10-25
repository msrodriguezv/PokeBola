// backend/src/server.js
const http = require('http');
const { Pool } = require('pg');
const { URL } = require('url');

const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://pokefy:pokepass@db:5432/pokefav';
const pool = new Pool({ connectionString: DATABASE_URL });

// helpers
function sendJSON(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(body);
}

function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch (err) { reject(err); }
    });
    req.on('error', err => reject(err));
  });
}

// DB actions
async function getFavorites(user) {
  const q = 'SELECT id, pokemon_id, pokemon_name, pokemon_data, created_at FROM favorites WHERE username=$1 ORDER BY created_at DESC';
  const r = await pool.query(q, [user]);
  return r.rows;
}

async function postFavorite(body) {
  try {
    const { user, pokemon_id, pokemon_name, pokemon_data } = body;
    const chk = await pool.query('SELECT id FROM favorites WHERE username=$1 AND pokemon_id=$2', [user, pokemon_id]);
    if (chk.rows.length) return { ok:true, id:chk.rows[0].id, existed:true };
    const pd = pokemon_data ? JSON.stringify(pokemon_data) : JSON.stringify({});
    const r = await pool.query(
      'INSERT INTO favorites(username,pokemon_id,pokemon_name,pokemon_data) VALUES($1,$2,$3,$4) RETURNING id',
      [user, pokemon_id, pokemon_name || '', pd]
    );
    console.log('Inserted favorite', r.rows[0]);
    return { ok:true, id:r.rows[0].id, existed:false };
  } catch(err) {
    console.error('DB Error:', err);
    throw new Error('db_error: ' + (err.message || 'unknown'));
  }
}

async function deleteFavorite(body) {
  const { user, pokemon_id } = body;
  const q = 'DELETE FROM favorites WHERE username=$1 AND pokemon_id=$2 RETURNING id';
  const r = await pool.query(q, [user, pokemon_id]);
  return { deleted: r.rowCount };
}

// Simple router
const server = http.createServer(async (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // GET /api/favorites?user=...
    if (req.method === 'GET' && pathname === '/api/favorites') {
      const user = url.searchParams.get('user');
      if (!user) return sendJSON(res, 400, { error: 'user required' });
      const rows = await getFavorites(user);
      return sendJSON(res, 200, rows);
    }

    // POST /api/favorites
    if (req.method === 'POST' && pathname === '/api/favorites') {
      const body = await parseJSONBody(req);
      if (!body.user || !body.pokemon_id) return sendJSON(res, 400, { error: 'user and pokemon_id required' });
      const result = await postFavorite(body);
      return sendJSON(res, 201, result);
    }

    // DELETE /api/favorites
    if (req.method === 'DELETE' && pathname === '/api/favorites') {
      const body = await parseJSONBody(req);
      if (!body.user || !body.pokemon_id) return sendJSON(res, 400, { error: 'user and pokemon_id required' });
      const result = await deleteFavorite(body);
      return sendJSON(res, 200, result);
    }

    res.writeHead(404, {'Content-Type':'text/plain'});
    res.end('Not Found');
  } catch (err) {
    console.error('Server error:', err);
    sendJSON(res, 500, { error: err.message || 'internal error' });
  }
});

server.listen(PORT, () => console.log(`Backend (vanilla) listening on port ${PORT}`));