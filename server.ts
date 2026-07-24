import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Resilient database file path loading and saving logic
let DB_FILE = path.join(process.cwd(), 'sessions_db.json');
let sessions: any[] = [];

const loadFromDisk = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  }
  return null;
};

try {
  const loaded = loadFromDisk(DB_FILE);
  if (loaded !== null) {
    sessions = loaded;
    console.log(`Loaded ${sessions.length} sessions from local disk storage.`);
  }
} catch (e) {
  console.warn('Could not read from primary path, trying /tmp path:', e);
  try {
    const tmpPath = path.join('/tmp', 'sessions_db.json');
    const loaded = loadFromDisk(tmpPath);
    if (loaded !== null) {
      sessions = loaded;
      DB_FILE = tmpPath;
      console.log(`Loaded ${sessions.length} sessions from Vercel /tmp storage.`);
    }
  } catch (err) {
    console.error('Failed to load sessions from disk, starting empty:', err);
  }
}

// Quick check to verify write access, fallback to /tmp if read-only
try {
  fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf8');
} catch (e) {
  console.log('Primary path is read-only. Switching database file path to /tmp for Vercel compliance.');
  DB_FILE = path.join('/tmp', 'sessions_db.json');
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (err) {
    console.error('Critically failed to write database to Vercel /tmp:', err);
  }
}

const saveToDisk = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save sessions to disk:', e);
  }
};

// API Endpoints for Session Sync
app.get('/api/sessions', (req, res) => {
  // Support optional ?id=... query parameter
  const queryId = req.query.id as string;
  if (queryId) {
    const session = sessions.find((s) => s.id === queryId);
    if (session) {
      return res.json(session);
    }
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(sessions);
});

app.get('/api/sessions/:id', (req, res) => {
  const session = sessions.find((s) => s.id === req.params.id);
  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

app.post('/api/sessions', (req, res) => {
  const incoming = req.body;
  if (!incoming || !incoming.id) {
    return res.status(400).json({ error: 'Invalid session body' });
  }

  const idx = sessions.findIndex((s) => s.id === incoming.id);
  if (idx !== -1) {
    sessions[idx] = incoming;
  } else {
    sessions.unshift(incoming);
  }

  // Sort sessions by lastUpdated descending
  sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  saveToDisk();
  res.json({ success: true, session: incoming });
});

app.delete('/api/sessions', (req, res) => {
  const queryId = req.query.id as string;
  if (!queryId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  sessions = sessions.filter((s) => s.id !== queryId);
  saveToDisk();
  res.json({ success: true });
});

app.delete('/api/sessions/:id', (req, res) => {
  const sessionId = req.params.id;
  sessions = sessions.filter((s) => s.id !== sessionId);
  saveToDisk();
  res.json({ success: true });
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
