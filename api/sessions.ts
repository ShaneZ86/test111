import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body?: any;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => VercelResponse;
}

// Unique bucket ID for this specific applet to isolate data
const BUCKET_ID = 'tk_refund_ece20567_819b_47fb_9e4e_3094b08c1c55';
const KV_URL = `https://kvdb.io/${BUCKET_ID}/sessions`;

// In-Memory Cache inside Vercel Serverless Instance for high-speed responsiveness
let cachedSessions: any[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 1500; // 1.5 seconds cache TTL

// Vercel serverless writable directory as local fallback
const DB_FILE = path.join('/tmp', 'sessions_db.json');

const loadSessionsLocalFallback = (): any[] => {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load fallback sessions:', e);
  }
  return [];
};

const saveSessionsLocalFallback = (sessions: any[]) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write fallback sessions:', e);
  }
};

// Fetch from the cloud database (KVDB)
const fetchFromCloud = async (): Promise<any[]> => {
  try {
    const res = await fetch(KV_URL, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    } else if (res.status === 404) {
      // Bucket/Key not initialized yet
      return [];
    }
  } catch (err) {
    console.error('Failed to fetch from Cloud KV:', err);
  }
  return [];
};

// Save to the cloud database (KVDB)
const saveToCloud = async (sessions: any[]): Promise<boolean> => {
  try {
    const res = await fetch(KV_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions),
      signal: AbortSignal.timeout(4000)
    });
    return res.ok;
  } catch (err) {
    console.error('Failed to save to Cloud KV:', err);
    return false;
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for robust API usage
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse direct or query params
  const pathParts = req.url ? req.url.split('?')[0].split('/').filter(Boolean) : [];
  let paramId: string | null = null;
  
  if (pathParts.length >= 3) {
    paramId = pathParts[2];
  } else if (req.query && req.query.id && typeof req.query.id === 'string') {
    paramId = req.query.id;
  }

  if (req.method === 'GET') {
    const now = Date.now();
    let sessions: any[] = [];

    // Use memory cache if available and within TTL
    if (cachedSessions && (now - lastCacheTime < CACHE_TTL_MS)) {
      sessions = cachedSessions;
    } else {
      // Load from Cloud KV
      sessions = await fetchFromCloud();
      
      // If cloud fetch failed or returned empty but we have fallback, merge or fallback
      if (sessions.length === 0) {
        sessions = loadSessionsLocalFallback();
      } else {
        // Keep fallback up to date
        saveSessionsLocalFallback(sessions);
      }
      
      // Update memory cache
      cachedSessions = sessions;
      lastCacheTime = now;
    }

    if (paramId) {
      const session = sessions.find((s) => s.id === paramId);
      if (session) {
        return res.status(200).json(session);
      } else {
        return res.status(404).json({ error: 'Session not found' });
      }
    }

    sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
    return res.status(200).json(sessions);
  }

  if (req.method === 'POST') {
    const incoming = req.body;
    if (!incoming || !incoming.id) {
      return res.status(400).json({ error: 'Invalid session body' });
    }

    const now = Date.now();
    
    // 1. Fetch current sessions
    let sessions = await fetchFromCloud();
    if (sessions.length === 0) {
      sessions = loadSessionsLocalFallback();
    }

    // 2. Insert or update
    const idx = sessions.findIndex((s) => s.id === incoming.id);
    if (idx !== -1) {
      sessions[idx] = incoming;
    } else {
      sessions.unshift(incoming);
    }
    sessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    // 3. Update memory cache and save locally
    cachedSessions = sessions;
    lastCacheTime = now;
    saveSessionsLocalFallback(sessions);

    // 4. Save to Cloud KV (asynchronous so request returns immediately)
    saveToCloud(sessions).catch((err) => {
      console.error('Background cloud save failed:', err);
    });

    return res.status(200).json({ success: true, session: incoming });
  }

  if (req.method === 'DELETE') {
    if (!paramId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const now = Date.now();
    let sessions = await fetchFromCloud();
    if (sessions.length === 0) {
      sessions = loadSessionsLocalFallback();
    }

    const filtered = sessions.filter((s) => s.id !== paramId);
    
    cachedSessions = filtered;
    lastCacheTime = now;
    saveSessionsLocalFallback(filtered);

    saveToCloud(filtered).catch((err) => {
      console.error('Background cloud delete failed:', err);
    });

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
