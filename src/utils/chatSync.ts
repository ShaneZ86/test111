import { ChatMessage } from '../types';

const CHANNEL_NAME = 'tiktok_refund_chat_sync_v2';
const STORAGE_KEY = 'tiktok_refund_messages_v2';

// BroadcastChannel for sub-millisecond cross-tab communication
let channel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
  } catch {
    channel = null;
  }
}

export const getSavedMessages = (defaultMsgs: ChatMessage[]): ChatMessage[] => {
  if (typeof window === 'undefined') return defaultMsgs;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return defaultMsgs;
};

export const saveAndBroadcastMessages = (msgs: ChatMessage[]) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error('Failed to save messages:', e);
  }

  if (channel) {
    try {
      channel.postMessage({ type: 'SYNC_MESSAGES', payload: msgs });
    } catch (e) {
      console.error('BroadcastChannel post error:', e);
    }
  }
};

export const subscribeToMessageSync = (onSync: (msgs: ChatMessage[]) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleBroadcast = (event: MessageEvent) => {
    if (event.data && event.data.type === 'SYNC_MESSAGES' && Array.isArray(event.data.payload)) {
      onSync(event.data.payload);
    }
  };

  if (channel) {
    channel.addEventListener('message', handleBroadcast);
  }

  // Fallback storage event listener for cross-tab sync
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

  window.addEventListener('storage', handleStorage);

  return () => {
    if (channel) {
      channel.removeEventListener('message', handleBroadcast);
    }
    window.removeEventListener('storage', handleStorage);
  };
};
