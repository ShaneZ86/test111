import React, { useState, useRef, useEffect } from 'react';
import { PageView, ChatMessage } from '../types';
import { AGENT_AVATAR, USER_AVATAR } from '../utils/orderNumber';
import { CustomerSession } from '../utils/sessionSync';

interface AgentWorkbenchPageProps {
  sessions: CustomerSession[];
  onUpdateSessionMessages: (sessionId: string, updater: (prev: ChatMessage[]) => ChatMessage[]) => void;
  onDeleteSession: (sessionId: string) => void;
  onNavigate: (page: PageView) => void;
  showToast: (msg: string) => void;
}

const EMOJI_LIST = ['😊', '😂', '👍', '🙏', '❤️', '😭', '😮', '🤔', '📦', '💰', '🚚', '👌', '🎉', '💯', '🤝', '🌹', '✨', '⏰', '💬'];

export const AgentWorkbenchPage: React.FC<AgentWorkbenchPageProps> = ({
  sessions,
  onUpdateSessionMessages,
  onDeleteSession,
  showToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [showSessionsDrawer, setShowSessionsDrawer] = useState(false);

  // State for session deletion confirmation modal (for long-press or delete button)
  const [sessionToDelete, setSessionToDelete] = useState<CustomerSession | null>(null);

  // Ref for long press timer
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef<boolean>(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default active session to first session if current active is invalid
  useEffect(() => {
    if (sessions.length > 0) {
      if (!activeSessionId || !sessions.some((s) => s.id === activeSessionId)) {
        setActiveSessionId(sessions[0].id);
      }
    } else {
      setActiveSessionId('');
    }
  }, [sessions, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;
  const messages = activeSession?.messages || [];

  // Auto scroll to bottom of chat canvas when messages update
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (customText?: string, imageUrl?: string, linkUrl?: string) => {
    if (!activeSession) {
      showToast('暂无有效会话');
      return;
    }

    const text = customText !== undefined ? customText : inputText.trim();
    if (!text && !imageUrl && !linkUrl) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    const newAgentMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'agent',
      agentName: 'Agent_007',
      agentAvatar: AGENT_AVATAR,
      text: text || (imageUrl ? '[图片]' : '[链接]'),
      imageUrl,
      linkUrl,
      linkTitle: linkUrl ? `退款进度查询单项` : undefined,
      timestamp: timeStr,
    };

    onUpdateSessionMessages(activeSession.id, (prev) => [...prev, newAgentMsg]);
    setInputText('');
    setShowEmojiPicker(false);
    showToast(`消息已同步发送至【${activeSession.customerName}】网页`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      handleSendMessage('请查看此项凭证图:', imgDataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendLink = () => {
    if (!activeSession) return;
    const link = `https://tiktok.com/refund/status`;
    handleSendMessage(`已为您生成专属退款进度查询链接，请点击查看：\n${link}`, undefined, link);
  };

  // Long press event handlers for session items
  const handleTouchStart = (session: CustomerSession) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setSessionToDelete(session);
    }, 550);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleMouseDown = (session: CustomerSession) => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setSessionToDelete(session);
    }, 550);
  };

  const handleMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  const handleSessionClick = (session: CustomerSession) => {
    if (isLongPressRef.current) {
      isLongPressRef.current = false;
      return;
    }
    setActiveSessionId(session.id);
    setShowSessionsDrawer(false);
  };

  const confirmDeleteSession = () => {
    if (!sessionToDelete) return;
    onDeleteSession(sessionToDelete.id);
    showToast(`已成功删除【${sessionToDelete.customerName}】的会话`);
    setSessionToDelete(null);
  };

  return (
    <div className="bg-[#f9f9fc] text-[#1a1c1e] h-full w-full flex flex-col overflow-hidden font-sans relative">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Confirmation Delete Dialog (Long Press Trigger) */}
      {sessionToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-[#c2c6d8]/60 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-[#ba1a1a] mb-3">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
              <h3 className="text-[16px] font-bold text-[#1a1c1e]">删除会话确认</h3>
            </div>
            <p className="text-[13px] text-[#585f66] leading-relaxed mb-4">
              您确定要删除顾客 <strong className="text-[#1a1c1e]">【{sessionToDelete.customerName}】</strong>的此项聊天会话吗？删除后不可恢复。
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 bg-[#f3f3f6] hover:bg-[#e2e2e5] text-[#1a1c1e] text-[13px] font-medium rounded-xl transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                onClick={confirmDeleteSession}
                className="px-4 py-2 bg-[#ba1a1a] hover:bg-[#961313] text-white text-[13px] font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header: Matching Customer page frame */}
      <header className="sticky top-0 w-full z-40 bg-white border-b border-[#c2c6d8] px-3.5 py-2 flex items-center justify-between flex-shrink-0 shadow-2xs">
        {activeSession ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <img
                alt={activeSession.customerName}
                className="w-9 h-9 rounded-full border border-[#c2c6d8] object-cover"
                src={activeSession.customerAvatar || USER_AVATAR}
                onError={(e) => { e.currentTarget.src = USER_AVATAR; }}
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[14px] text-[#1a1c1e] truncate">{activeSession.customerName}</span>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded border border-emerald-200 font-medium shrink-0">
                  在线沟通
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[13px] text-[#585f66] font-medium">暂无激活会话</div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowSessionsDrawer((prev) => !prev)}
            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#0066ff] border border-blue-200 text-[12px] font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
            title="选择客服会话"
          >
            <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
            <span>会话列表 ({sessions.length})</span>
          </button>
        </div>
      </header>

      {/* Sessions Selector Drawer Modal */}
      {showSessionsDrawer && (
        <div className="absolute inset-0 bg-black/40 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl max-h-[80%] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-250">
            <div className="p-3.5 border-b border-[#c2c6d8] flex justify-between items-center bg-[#f9f9fc]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0066ff] text-[20px]">forum</span>
                <span className="font-bold text-[15px] text-[#1a1c1e]">所有客服会话 ({sessions.length})</span>
                <span className="text-[11px] text-[#727687]">(支持长按删除)</span>
              </div>
              <button
                onClick={() => setShowSessionsDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#e8e8ea] hover:bg-[#dedede] flex items-center justify-center text-[#585f66] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-2 mobile-scroll divide-y divide-[#c2c6d8]/30">
              {sessions.length === 0 ? (
                <div className="p-8 text-center text-[#727687] text-[13px]">
                  暂无任何顾客会话。<br />当顾客点击访问顾客主页时，会在此自动生成新会话。
                </div>
              ) : (
                sessions.map((session) => {
                  const lastMsg = session.messages[session.messages.length - 1];
                  const isSelected = activeSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      onTouchStart={() => handleTouchStart(session)}
                      onTouchEnd={handleTouchEnd}
                      onMouseDown={() => handleMouseDown(session)}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onClick={() => handleSessionClick(session)}
                      className={`p-3 flex items-center gap-3 cursor-pointer rounded-xl transition-all my-1 group relative select-none ${
                        isSelected
                          ? 'bg-blue-50/80 border border-blue-200 shadow-2xs'
                          : 'hover:bg-[#f3f3f6]'
                      }`}
                      title="长按或右侧图标可选择删除"
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          alt={session.customerName}
                          className="w-10 h-10 rounded-full border border-[#c2c6d8] object-cover"
                          src={session.customerAvatar || USER_AVATAR}
                          onError={(e) => { e.currentTarget.src = USER_AVATAR; }}
                        />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-white"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[14px] font-bold text-[#1a1c1e]">{session.customerName}</span>
                          <span className="text-[11px] text-[#727687]">
                            {lastMsg ? lastMsg.timestamp : ''}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#727687] truncate mt-0.5">
                          {lastMsg ? lastMsg.text : '无更多消息'}
                        </p>
                      </div>

                      {/* Explicit Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session);
                        }}
                        className="p-1.5 rounded-lg text-[#ba1a1a] hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                        title="删除此会话"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Mobile Chat Canvas */}
      <div
        ref={chatContainerRef}
        className="flex-1 mobile-scroll p-3.5 sm:p-4 space-y-3.5 bg-[#F5F7FA]"
      >
        {!activeSession ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#727687]">
            <span className="material-symbols-outlined text-[48px] text-[#c2c6d8] mb-2">inbox</span>
            <p className="text-[14px] font-medium text-[#1a1c1e] mb-1">暂无活跃的客服对话</p>
            <p className="text-[12px] max-w-xs">
              当顾客进入顾客端网页（?role=customer）时，系统会自动在此为您生成由随机中文人名命名的专属客服会话。
            </p>
          </div>
        ) : (
          <>
            {/* Session Info Banner inside Chat */}
            <div className="text-center my-1">
              <span className="inline-block bg-[#e8e8ea]/80 text-[#585f66] text-[11px] px-3 py-1 rounded-full font-medium shadow-2xs">
                💬 您正在与顾客 【{activeSession.customerName}】 沟通
              </span>
            </div>

            {messages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex gap-2.5 max-w-[88%]">
                    <img
                      alt="User"
                      className="w-8 h-8 rounded-full shrink-0 border border-[#c2c6d8] object-cover"
                      src={activeSession.customerAvatar || USER_AVATAR}
                      onError={(e) => { e.currentTarget.src = USER_AVATAR; }}
                    />
                    <div className="flex flex-col gap-1">
                      <div className="bg-white text-[#1a1c1e] px-3.5 py-2 rounded-2xl rounded-tl-none text-[14px] shadow-2xs border border-[#c2c6d8]/30 leading-relaxed">
                        {msg.imageUrl ? (
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded attachment"
                            className="max-w-[200px] sm:max-w-xs rounded-lg border border-[#c2c6d8]"
                          />
                        ) : (
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        )}
                      </div>
                      <span className="text-[10px] text-[#727687] ml-1">{msg.timestamp}</span>
                    </div>
                  </div>
                );
              }

              // Agent Message
              return (
                <div key={msg.id} className="flex gap-2.5 max-w-[88%] ml-auto flex-row-reverse">
                  <img
                    alt="Agent"
                    className="w-8 h-8 rounded-full shrink-0 border border-[#c2c6d8] object-cover"
                    src={msg.agentAvatar || AGENT_AVATAR}
                    onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }}
                  />
                  <div className="flex flex-col gap-1 items-end">
                    <div className="bg-[#0066ff] text-white px-3.5 py-2 rounded-2xl rounded-tr-none text-[14px] shadow-xs leading-relaxed">
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Sent image"
                          className="max-w-[200px] sm:max-w-xs rounded-lg border border-white/20 mb-2"
                        />
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {msg.linkUrl && (
                        <a
                          href={msg.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block bg-white/15 hover:bg-white/25 p-2 rounded-lg text-white underline text-[12px] transition-colors"
                        >
                          🔗 {msg.linkTitle || '点击打开退款服务专属链接'}
                        </a>
                      )}
                    </div>
                    <span className="text-[10px] text-[#727687] mr-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom Reply Input Area */}
      {activeSession && (
        <div className="p-2.5 sm:p-3 border-t border-[#c2c6d8] bg-white flex-shrink-0 relative">
          {/* Emoji Drawer */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-2 right-2 mb-2 bg-white border border-[#c2c6d8] rounded-xl p-2.5 grid grid-cols-8 sm:grid-cols-10 gap-1.5 shadow-xl max-h-36 overflow-y-auto z-30">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setInputText((prev) => prev + emoji)}
                  className="text-[18px] hover:bg-[#f3f3f6] p-1 rounded-md transition-transform active:scale-125 cursor-pointer flex items-center justify-center"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Toolbar Buttons + Input Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="material-symbols-outlined text-[#585f66] hover:text-[#0066ff] p-1.5 transition-colors text-[22px] cursor-pointer shrink-0"
              title="插入表情包"
            >
              sentiment_satisfied
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="material-symbols-outlined text-[#585f66] hover:text-[#0066ff] p-1.5 transition-colors text-[22px] cursor-pointer shrink-0"
              title="上传并发送图片"
            >
              image
            </button>
            <button
              onClick={handleSendLink}
              className="material-symbols-outlined text-[#585f66] hover:text-[#0066ff] p-1.5 transition-colors text-[22px] cursor-pointer shrink-0"
              title="发送退款快捷校验链接"
            >
              attach_file
            </button>

            {/* Input Box */}
            <div className="flex-1 bg-[#f3f3f6] rounded-xl border border-[#c2c6d8] px-3 py-1.5 flex items-center focus-within:ring-2 focus-within:ring-[#0066ff]/20 focus-within:border-[#0066ff] transition-all">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  setShowEmojiPicker(false);
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: 'smooth',
                      });
                    }
                  }, 120);
                  setTimeout(() => {
                    if (chatContainerRef.current) {
                      chatContainerRef.current.scrollTo({
                        top: chatContainerRef.current.scrollHeight,
                        behavior: 'smooth',
                      });
                    }
                  }, 300);
                }}
                className="w-full bg-transparent text-[16px] sm:text-[14px] text-[#1a1c1e] outline-none font-sans"
                placeholder={`回复 ${activeSession.customerName}...`}
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              className="bg-[#0066ff] text-white px-3.5 py-1.5 rounded-xl text-[13px] font-bold shadow-xs hover:bg-[#0050cb] active:scale-95 transition-all cursor-pointer shrink-0 flex items-center justify-center"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
