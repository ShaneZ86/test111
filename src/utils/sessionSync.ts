import { ChatMessage } from '../types';
import { generate20DigitOrderNumber, AGENT_AVATAR, USER_AVATAR } from './orderNumber';
import { generateRandomChineseName, getRandomUserAvatar } from './nameGenerator';

export interface CustomerSession {
  id: string;
  customerName: string;
  customerAvatar: string;
  orderNumber: string;
  createdAt: string;
  lastUpdated: string;
  messages: ChatMessage[];
  unreadCount?: number;
}

const STORAGE_KEY = 'tiktok_refund_sessions_v4';
const CHANNEL_NAME = 'tiktok_refund_session_channel_v4';
const CUSTOMER_SESSION_ID_KEY = 'tiktok_customer_session_id_v4';

let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
}

/**
 * Get all stored customer sessions as an array sorted by lastUpdated descending.
 */
export const getAllSessions = (): CustomerSession[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((session) => {
          session.customerAvatar = USER_AVATAR;
          if (session.messages && Array.isArray(session.messages)) {
            session.messages.forEach((msg: ChatMessage) => {
              if (msg.sender === 'agent') {
                msg.agentAvatar = AGENT_AVATAR;
              } else if (msg.sender === 'user') {
                msg.userAvatar = USER_AVATAR;
              }
            });
          }
        });
        return parsed.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());
      }
    }
  } catch (e) {
    console.error('Failed to parse sessions:', e);
  }
  return [];
};

/**
 * Save all sessions to localStorage, broadcast to other tabs, and sync to Express API + Firestore.
 */
export const saveAndBroadcastSessions = async (sessions: CustomerSession[]) => {
  if (typeof window === 'undefined') return;
  
  // Save locally first
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }

  // Broadcast via BroadcastChannel
  if (channel) {
    try {
      channel.postMessage({ type: 'SYNC_SESSIONS', payload: sessions });
    } catch (e) {
      console.error('BroadcastChannel post error:', e);
    }
  }

  // Dispatch custom event for same-window synchronization
  window.dispatchEvent(new CustomEvent('tiktok_sessions_updated', { detail: sessions }));

  // Upload each updated session to Express API & Firestore (completely non-blocking)
  for (const s of sessions) {
    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    }).catch((err) => {
      console.error('Failed to sync session to Express API:', err);
    });
  }
};

/**
 * Get current customer session or create a brand new session if entering customer page.
 */
export const getOrCreateCustomerSession = (): CustomerSession => {
  const sessions = getAllSessions();
  const nowStr = new Date().toISOString();

  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentHHMM = `${hours}:${minutes}`;

  if (typeof window !== 'undefined') {
    const existingId = localStorage.getItem(CUSTOMER_SESSION_ID_KEY);
    if (existingId) {
      const existingSession = sessions.find((s) => s.id === existingId);
      if (existingSession) {
        if (existingSession.messages && existingSession.messages.length > 0) {
          if (existingSession.messages[0].id.startsWith('init')) {
            existingSession.messages[0].timestamp = currentHHMM;
          }
        }
        existingSession.customerAvatar = USER_AVATAR;
        if (existingSession.messages) {
          existingSession.messages.forEach((msg) => {
            if (msg.sender === 'agent') msg.agentAvatar = AGENT_AVATAR;
            if (msg.sender === 'user') msg.userAvatar = USER_AVATAR;
          });
        }
        return existingSession;
      } else {
        // Return temporary loading skeleton if list is still loading
        const tempSession: CustomerSession = {
          id: existingId,
          customerName: '退款咨询用户',
          customerAvatar: USER_AVATAR,
          orderNumber: generate20DigitOrderNumber(),
          createdAt: nowStr,
          lastUpdated: nowStr,
          messages: [{
            id: `init_${Date.now()}`,
            sender: 'agent',
            agentName: '官方客服-小林',
            agentAvatar: AGENT_AVATAR,
            text: `正在连接官方客服...`,
            timestamp: currentHHMM,
          }],
          unreadCount: 0,
        };
        return tempSession;
      }
    }
  }

  // Generate a brand new customer session
  const newOrderNumber = generate20DigitOrderNumber();
  const newName = generateRandomChineseName();
  const newAvatar = getRandomUserAvatar();
  const newId = `session_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  const initialMessage: ChatMessage = {
    id: `init_${Date.now()}`,
    sender: 'agent',
    agentName: '官方客服-小林',
    agentAvatar: AGENT_AVATAR,
    text: `您好，我是抖音官方服务专家小林，很高兴为您服务。`,
    timestamp: currentHHMM,
  };

  const newSession: CustomerSession = {
    id: newId,
    customerName: newName,
    customerAvatar: newAvatar,
    orderNumber: newOrderNumber,
    createdAt: nowStr,
    lastUpdated: nowStr,
    messages: [initialMessage],
    unreadCount: 0,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(CUSTOMER_SESSION_ID_KEY, newId);
  }

  const updatedSessions = [newSession, ...sessions];
  
  // Local Save
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
  window.dispatchEvent(new CustomEvent('tiktok_sessions_updated', { detail: updatedSessions }));

  // Upload to Express API
  fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newSession)
  }).catch((err) => {
    console.error('Failed to create new session in Express API:', err);
  });

  return newSession;
};

/**
 * Update messages for a specific session directly to Firestore and Express API.
 */
export const updateSessionMessages = async (
  sessionId: string,
  updater: (prevMsgs: ChatMessage[]) => ChatMessage[]
) => {
  if (typeof window === 'undefined') return;

  const sessions = getAllSessions();
  let currentSession = sessions.find((s) => s.id === sessionId) || null;

  if (!currentSession) {
    // Try to load from local Express API (fast and unblocked in China)
    try {
      const res = await fetch(`/api/sessions?id=${sessionId}`);
      if (res.ok) {
        currentSession = await res.json();
      }
    } catch (err) {
      console.error('Error fetching session from Express API:', err);
    }
  }

  if (!currentSession) return;

  const prevMsgs = currentSession.messages || [];
  const nextMsgs = updater(prevMsgs);
  const nowStr = new Date().toISOString();

  const updatedSession = {
    ...currentSession,
    messages: nextMsgs,
    lastUpdated: nowStr,
  };

  // Keep local storage immediately updated for flawless latency-compensation
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    sessions[index] = updatedSession;
  } else {
    sessions.unshift(updatedSession);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  window.dispatchEvent(new CustomEvent('tiktok_sessions_updated', { detail: sessions }));

  // Save to Express API asynchronously (completely non-blocking, no await!)
  fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedSession)
  }).catch((err) => {
    console.error('Failed to save updated messages to Express API:', err);
  });
};

/**
 * Delete a session by ID.
 */
export const deleteSession = async (sessionId: string) => {
  if (typeof window === 'undefined') return;

  // Delete from Express API
  try {
    await fetch(`/api/sessions?id=${sessionId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('Failed to delete session from Express API:', err);
  }

  // Local fallback delete
  const sessions = getAllSessions();
  const filtered = sessions.filter((s) => s.id !== sessionId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('tiktok_sessions_updated', { detail: filtered }));
};

/**
 * Subscribe to session changes across windows/tabs/devices using HTTP polling!
 */
export const subscribeSessions = (onSync: (sessions: CustomerSession[]) => void) => {
  if (typeof window === 'undefined') return () => {};

  let isStopped = false;

  // Primary live-sync channel: HTTP Polling to /api/sessions (every 2 seconds)
  // This is highly robust, works flawlessly in China, and completely bypasses Firebase blocking.
  const pollSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok && !isStopped) {
        const remoteSessions: CustomerSession[] = await res.json();
        
        // Normalize avatars and sort by lastUpdated descending
        remoteSessions.forEach((session) => {
          session.customerAvatar = USER_AVATAR;
          if (session.messages && Array.isArray(session.messages)) {
            session.messages.forEach((msg: ChatMessage) => {
              if (msg.sender === 'agent') {
                msg.agentAvatar = AGENT_AVATAR;
              } else if (msg.sender === 'user') {
                msg.userAvatar = USER_AVATAR;
              }
            });
          }
        });

        remoteSessions.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

        // Save to local storage for offline / persistence support
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteSessions));
        } catch {}

        if (!isStopped) {
          onSync(remoteSessions);
        }
      }
    } catch (err) {
      console.warn('API polling fetch failed (normal if offline or server restarting):', err);
    }
  };

  // Run immediate sync
  pollSessions();

  // Polling Interval
  const intervalId = setInterval(pollSessions, 2000);

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_SESSIONS' && Array.isArray(event.data.payload)) {
      onSync(event.data.payload);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcast);
  }

  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          onSync(parsed);
        }
      } catch {
        // ignore
      }
    }
  };

  const handleLocalUpdate = (e: Event) => {
    const customEvent = e as CustomEvent<CustomerSession[]>;
    if (customEvent.detail && Array.isArray(customEvent.detail)) {
      onSync(customEvent.detail);
    }
  };

  window.addEventListener('storage', handleStorage);
  window.addEventListener('tiktok_sessions_updated', handleLocalUpdate);

  // Return unsubscribe
  return () => {
    isStopped = true;
    clearInterval(intervalId);
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('tiktok_sessions_updated', handleLocalUpdate);
  };
};
