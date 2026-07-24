import React, { useState, useEffect, useCallback } from 'react';
import { PageView, ChatMessage } from './types';
import { MainChatPage } from './components/MainChatPage';
import { ServiceEvaluationPage } from './components/ServiceEvaluationPage';
import { CustomerServiceOverviewPage } from './components/CustomerServiceOverviewPage';
import { LeaveMessagePage } from './components/LeaveMessagePage';
import { AgentWorkbenchPage } from './components/AgentWorkbenchPage';
import { TikTokLogo } from './components/TikTokLogo';
import {
  CustomerSession,
  getOrCreateCustomerSession,
  getAllSessions,
  updateSessionMessages,
  deleteSession,
  subscribeSessions,
} from './utils/sessionSync';

export default function App() {
  // Determine current web portal role based on URL parameter (?role=agent vs default customer) or URL path (/agent)
  const [role] = useState<'customer' | 'agent'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlRole = params.get('role');
      if (urlRole === 'agent' || urlRole === 'workbench') return 'agent';

      const pathname = window.location.pathname.toLowerCase();
      if (
        pathname === '/agent' || 
        pathname === '/agent/' || 
        pathname === '/workbench' || 
        pathname === '/workbench/' ||
        pathname.startsWith('/agent/') ||
        pathname.startsWith('/workbench/')
      ) {
        return 'agent';
      }
    }
    return 'customer';
  });

  // Current active sub-page for Customer View (Defaults to Customer Service Overview Page)
  const [currentPage, setCurrentPage] = useState<PageView>('overview');

  // Global Toast Alert
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // State for Customer view session
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);

  // State for Agent view all sessions list
  const [allSessions, setAllSessions] = useState<CustomerSession[]>([]);

  // Dynamic mobile viewport height state for soft keyboard adaptation
  const [mobileViewportHeight, setMobileViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      if (window.innerWidth < 640) {
        const headerHeight = 46;
        setMobileViewportHeight(vv.height - headerHeight);
      } else {
        setMobileViewportHeight(null);
      }
    };

    handleResize();
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Initialize role data
  useEffect(() => {
    if (role === 'customer') {
      const session = getOrCreateCustomerSession();
      setCustomerSession(session);
    }
    setAllSessions(getAllSessions());
  }, [role]);

  // Subscribe to real-time session sync across windows/tabs
  useEffect(() => {
    const unsubscribe = subscribeSessions((sessions) => {
      setAllSessions(sessions);
      if (role === 'customer') {
        const mySessionId = localStorage.getItem('tiktok_customer_session_id_v4');
        const updatedMine = sessions.find((s) => s.id === mySessionId);
        if (updatedMine) {
          setCustomerSession(updatedMine);
        }
      }
    });
    return unsubscribe;
  }, [role]);

  // Customer setMessages wrapper
  const handleCustomerSetMessages = useCallback((updater: React.SetStateAction<ChatMessage[]>) => {
    const mySessionId = localStorage.getItem('tiktok_customer_session_id_v4');
    if (!mySessionId) return;

    // Update local state instantly for latency-compensation
    setCustomerSession((prev) => {
      if (!prev) return null;
      const nextMsgs = typeof updater === 'function' ? (updater as any)(prev.messages) : updater;
      return {
        ...prev,
        messages: nextMsgs,
        lastUpdated: new Date().toISOString(),
      };
    });

    updateSessionMessages(mySessionId, (prevMsgs) => {
      const next = typeof updater === 'function' ? (updater as any)(prevMsgs) : updater;
      return next;
    });
  }, []);

  // Agent update messages wrapper
  const handleAgentUpdateMessages = useCallback((sessionId: string, updater: (prev: ChatMessage[]) => ChatMessage[] | React.SetStateAction<ChatMessage[]>) => {
    // Update local list state instantly for latency-compensation
    setAllSessions((prevSessions) => {
      return prevSessions.map((s) => {
        if (s.id === sessionId) {
          const nextMsgs = typeof updater === 'function' ? (updater as any)(s.messages) : updater;
          return {
            ...s,
            messages: nextMsgs,
            lastUpdated: new Date().toISOString(),
          };
        }
        return s;
      });
    });

    updateSessionMessages(sessionId, (prevMsgs) => {
      const next = typeof updater === 'function' ? (updater as any)(prevMsgs) : updater;
      return next;
    });
  }, []);

  // Agent delete session wrapper
  const handleAgentDeleteSession = useCallback((sessionId: string) => {
    deleteSession(sessionId);
  }, []);

  const orderNumber = customerSession?.orderNumber || '76251885557947289016';
  const customerMessages = customerSession?.messages || [];

  return (
    <div className="h-screen w-full overflow-hidden bg-[#f3f3f6] text-[#1a1c1e] flex flex-col items-center justify-start relative font-sans selection:bg-blue-100 selection:text-blue-700">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#1a1c1e]/90 text-white text-[13px] font-medium px-5 py-2.5 rounded-full shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Top Header Bar */}
      <header className="w-full bg-white border-b border-[#c2c6d8] px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between shadow-2xs z-50 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <TikTokLogo className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="font-bold text-[14px] sm:text-[15px] text-[#1a1c1e] truncate">
            {role === 'customer' ? '抖音退款 - 顾客服务中心' : '抖音退款 - 官方客服工作台'}
          </span>
        </div>
      </header>

      {/* Main Responsive Web Viewport */}
      <main className="w-full flex-1 flex flex-col justify-start items-center overflow-hidden">
        {role === 'customer' ? (
          /* Customer Web View: Pure Customer View with NO Access to Agent Workbench */
          <div
            style={mobileViewportHeight ? { height: `${mobileViewportHeight}px` } : undefined}
            className="w-full max-w-2xl h-[calc(100dvh-46px)] sm:h-[calc(100dvh-50px)] bg-white sm:shadow-md sm:border-x border-[#c2c6d8]/60 overflow-hidden flex flex-col relative transition-[height] duration-75 ease-out"
          >
            {currentPage === 'chat' && (
              <MainChatPage
                orderNumber={orderNumber}
                onNavigate={setCurrentPage}
                messages={customerMessages}
                setMessages={handleCustomerSetMessages}
                showToast={showToast}
              />
            )}
            {currentPage === 'evaluation' && (
              <ServiceEvaluationPage onNavigate={setCurrentPage} showToast={showToast} />
            )}
            {currentPage === 'overview' && (
              <CustomerServiceOverviewPage
                orderNumber={orderNumber}
                onNavigate={setCurrentPage}
                showToast={showToast}
                messages={customerMessages}
                setMessages={handleCustomerSetMessages}
              />
            )}
            {currentPage === 'leave_message' && (
              <LeaveMessagePage onNavigate={setCurrentPage} showToast={showToast} />
            )}
          </div>
        ) : (
          /* Agent Workbench Web View: Displays all customer sessions */
          <div
            style={mobileViewportHeight ? { height: `${mobileViewportHeight}px` } : undefined}
            className="w-full max-w-2xl h-[calc(100dvh-46px)] sm:h-[calc(100dvh-50px)] bg-white sm:shadow-md sm:border-x border-[#c2c6d8]/60 overflow-hidden flex flex-col relative transition-[height] duration-75 ease-out"
          >
            <AgentWorkbenchPage
              sessions={allSessions}
              onUpdateSessionMessages={handleAgentUpdateMessages}
              onDeleteSession={handleAgentDeleteSession}
              onNavigate={setCurrentPage}
              showToast={showToast}
            />
          </div>
        )}
      </main>
    </div>
  );
}
