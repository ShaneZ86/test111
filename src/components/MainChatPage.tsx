import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PageView } from '../types';
import { AGENT_AVATAR, USER_AVATAR } from '../utils/orderNumber';
import { getCustomerServiceReply } from '../utils/replyEngine';
import { TikTokLogo } from './TikTokLogo';

interface MainChatPageProps {
  orderNumber: string;
  onNavigate: (page: PageView) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  showToast: (msg: string) => void;
}

const EMOJI_LIST = ['😊', '😂', '👍', '🙏', '❤️', '😭', '😮', '🤔', '📦', '💰', '🚚', '👌', '🎉', '💯', '🤝', '🌹', '✨', '⏰'];

export const MainChatPage: React.FC<MainChatPageProps> = ({
  orderNumber,
  onNavigate,
  messages,
  setMessages,
  showToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom helper
  const scrollToBottom = (smooth = true) => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto',
      });
    }
  };

  // Auto scroll to bottom when messages change or typing state changes
  useEffect(() => {
    scrollToBottom(true);
  }, [messages, isTyping]);

  // Simulated auto-reply effect
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.sender !== 'user') return;

    // Trigger typing effect
    setIsTyping(true);

    const timer = setTimeout(() => {
      setIsTyping(false);

      const reply = getCustomerServiceReply(lastMsg.text || '', orderNumber);
      
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const timeStrResult = `${hours}:${minutes}`;

      const agentMsg: ChatMessage = {
        id: `reply_${Date.now()}`,
        sender: 'agent',
        agentName: '官方客服-小林',
        agentAvatar: AGENT_AVATAR,
        text: reply.text,
        refundCard: reply.refundCard,
        timestamp: timeStrResult,
        isRead: false,
      };

      setMessages((prev) => {
        // Prevent duplicate replies if already processed
        if (prev.some((m) => m.id.startsWith('reply_') && m.text === reply.text)) {
          return prev;
        }
        return [...prev, agentMsg];
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [messages, orderNumber, setMessages]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes} · 已送达`;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      userAvatar: USER_AVATAR,
      text,
      timestamp: timeStr,
      isRead: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} · 已送达`;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        userAvatar: USER_AVATAR,
        text: '[图片]',
        imageUrl: imgDataUrl,
        timestamp: timeStr,
        isRead: true,
      };

      setMessages((prev) => [...prev, userMsg]);
      showToast('图片已发送');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const triggerVoiceRecord = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      handleSendMessage('语音消息: 请帮我查一下退款账单');
    }, 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9fc] relative overflow-hidden">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 bg-[#f9f9fc]/95 backdrop-blur-md border-b border-[#e2e2e5] flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('overview')}
            className="material-symbols-outlined text-[#1a1c1e] p-2 hover:bg-[#e2e2e5]/50 active:scale-95 transition-all rounded-full cursor-pointer"
            title="返回客服主页"
          >
            arrow_back
          </button>
          <TikTokLogo className="w-6 h-6" />
          <div className="flex flex-col">
            <span className="font-bold text-[16px] text-[#1a1c1e] leading-tight">官方客服-小林</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-[#585f66] font-medium">在线</span>
            </div>
          </div>
        </div>

        <div className="flex items-center relative">
          <button
            onClick={() => setShowMenuDrawer((prev) => !prev)}
            className="material-symbols-outlined text-[#1a1c1e] p-2 hover:bg-[#e2e2e5]/50 active:scale-95 transition-all rounded-full cursor-pointer"
            title="更多操作"
          >
            more_vert
          </button>

          {/* Menu Drawer */}
          {showMenuDrawer && (
            <div className="absolute right-0 top-12 w-48 bg-white border border-[#e2e2e5] shadow-xl rounded-xl py-2 z-50 text-[14px]">
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  onNavigate('overview');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f3f3f6] flex items-center gap-2 text-[#1a1c1e]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0050cb]">assignment</span>
                查看服务单详情
              </button>
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  onNavigate('evaluation');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f3f3f6] flex items-center gap-2 text-[#1a1c1e]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0050cb]">star</span>
                评价服务
              </button>
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  onNavigate('leave_message');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f3f3f6] flex items-center gap-2 text-[#1a1c1e]"
              >
                <span className="material-symbols-outlined text-[18px] text-[#0050cb]">mail</span>
                给客服留言
              </button>
              <div className="border-t border-[#e2e2e5] my-1"></div>
              <button
                onClick={() => {
                  setShowMenuDrawer(false);
                  showToast('消息记录已同步更新');
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#f3f3f6] flex items-center gap-2 text-[#585f66]"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                刷新对话状态
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Main Chat Canvas */}
      <main
        ref={chatContainerRef}
        className="flex-1 mobile-scroll px-4 py-4 flex flex-col gap-5"
      >
        {/* Connection System Pill */}
        <div className="flex justify-center my-1">
          <span className="bg-[#eeeef0] text-[#585f66] text-[12px] px-4 py-1 rounded-full font-medium shadow-2xs">
            正在为您连接人工客服...
          </span>
        </div>

        {/* Chat Messages */}
        {messages.map((msg) => {
          if (msg.sender === 'agent') {
            return (
              <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[75%] self-start">
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-xs border border-[#e2e2e5] bg-white">
                  <img
                    src={msg.agentAvatar || AGENT_AVATAR}
                    onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }}
                    alt="Agent Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-[12px] text-[#585f66] px-0.5">{msg.agentName || '官方客服-小林'}</span>
                  <div className="message-bubble-agent bg-[#e2e2e5] border border-[#c2c6d8] text-[#1a1c1e] p-3.5 shadow-2xs text-[15px] leading-relaxed">
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Refund Information Card inside bubble if present */}
                    {msg.refundCard && (
                      <div className="mt-3 p-3 bg-white border border-[#c2c6d8] rounded-lg flex flex-col gap-2 shadow-2xs">
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-[#585f66]">退款金额</span>
                          <span className="text-[#0050cb] font-bold text-[15px]">{msg.refundCard.amount}</span>
                        </div>
                        <div className="flex justify-between items-center text-[13px]">
                          <span className="text-[#585f66]">退回路径</span>
                          <span className="text-[#1a1c1e] font-medium">{msg.refundCard.path}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] text-[#727687] px-1 mt-0.5">{msg.timestamp}</span>
                </div>
              </div>
            );
          }

          // User Message
          return (
            <div key={msg.id} className="flex items-start gap-2.5 max-w-[88%] sm:max-w-[75%] self-end flex-row-reverse">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-xs border border-blue-200 bg-white">
                <img
                  src={msg.userAvatar || USER_AVATAR}
                  onError={(e) => { e.currentTarget.src = USER_AVATAR; }}
                  alt="User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-1 items-end min-w-0">
                <div className="message-bubble-user bg-[#0050cb] text-white p-3.5 shadow-md text-[15px] leading-relaxed">
                  {msg.imageUrl ? (
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded attachment"
                      className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-white/20"
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}
                </div>
                <span className="text-[11px] text-[#727687] px-1 mt-0.5 text-right flex items-center gap-1">
                  {msg.timestamp}
                </span>
              </div>
            </div>
          );
        })}


        {/* Real-time typing indicator is removed as requested */}
      </main>

      {/* Floating Quick Evaluation Pill (Hidden when soft keyboard/input focused to save viewport space) */}
      {!isInputFocused && (
        <div className="flex justify-center pointer-events-none py-1.5 bg-[#f9f9fc]/80 backdrop-blur-xs border-t border-[#e2e2e5]/50 shrink-0">
          <button
            onClick={() => onNavigate('evaluation')}
            className="pointer-events-auto shadow-xs bg-white text-[#0050cb] border border-[#0050cb]/30 font-semibold text-[12px] px-4 py-1 rounded-full hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">rate_review</span>
            评价服务
          </button>
        </div>
      )}

      {/* Recording Simulation Overlay Modal */}
      {isRecording && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 text-center shadow-2xl max-w-xs w-full animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-[#0050cb] animate-pulse">
              <span className="material-symbols-outlined text-[36px]">mic</span>
            </div>
            <div>
              <h3 className="font-bold text-[#1a1c1e] text-[16px]">正在录音...</h3>
              <p className="text-[13px] text-[#585f66] mt-1">请说话，松开后自动识别发送</p>
            </div>
            <div className="w-full bg-blue-50 h-2 rounded-full overflow-hidden">
              <div className="bg-[#0050cb] h-full w-2/3 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Input Area & Toolbar */}
      <footer className="shrink-0 z-40 bg-white border-t border-[#e2e2e5] flex flex-col pb-safe">
        {/* Emoji Picker Drawer */}
        {showEmojiPicker && (
          <div className="bg-[#f3f3f6] border-b border-[#e2e2e5] p-3 grid grid-cols-6 sm:grid-cols-9 gap-2 max-h-40 overflow-y-auto">
            {EMOJI_LIST.map((emoji) => (
              <button
                key={emoji}
                onClick={() => addEmoji(emoji)}
                className="text-[22px] hover:bg-white p-2 rounded-lg transition-transform active:scale-125 cursor-pointer flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Input Controls Bar */}
        <div className="flex items-center gap-2 px-3 py-2.5 max-w-4xl mx-auto w-full">
          {/* Toolbar Icons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={triggerVoiceRecord}
              className="material-symbols-outlined p-2 text-[#585f66] hover:text-[#0050cb] active:scale-90 transition-colors rounded-full cursor-pointer"
              title="语音输入"
            >
              mic
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="material-symbols-outlined p-2 text-[#585f66] hover:text-[#0050cb] active:scale-90 transition-colors rounded-full cursor-pointer"
              title="发送图片"
            >
              image
            </button>
          </div>

          {/* Text Input */}
          <div className="flex-grow relative flex items-center">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                setIsInputFocused(true);
                setShowEmojiPicker(false);
                setTimeout(() => scrollToBottom(true), 120);
                setTimeout(() => scrollToBottom(true), 300);
              }}
              onBlur={() => {
                setIsInputFocused(false);
              }}
              placeholder="输入消息..."
              className="w-full bg-[#f3f3f6] border-none rounded-xl pl-4 pr-10 py-2.5 text-[16px] sm:text-[15px] focus:ring-2 focus:ring-[#0050cb]/20 focus:bg-white transition-all outline-none text-[#1a1c1e]"
            />
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`absolute right-2.5 material-symbols-outlined text-[22px] cursor-pointer transition-colors ${
                showEmojiPicker ? 'text-[#0050cb]' : 'text-[#585f66] hover:text-[#0050cb]'
              }`}
              title="表情包"
            >
              sentiment_satisfied
            </button>
          </div>

          {/* Send / Add Button */}
          {inputText.trim() ? (
            <button
              onClick={() => handleSendMessage()}
              className="bg-[#0050cb] text-white p-2.5 rounded-full active:scale-90 transition-transform shadow-sm cursor-pointer flex items-center justify-center shrink-0"
              title="发送消息"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          ) : (
            <button
              onClick={() => {
                // Quick shortcut option or prompt
                handleSendMessage('我想了解退款处理进度');
              }}
              className="material-symbols-outlined p-2 bg-[#0050cb] text-white rounded-full active:scale-90 transition-transform shadow-md cursor-pointer shrink-0"
              title="发送快捷沟通"
            >
              add_circle
            </button>
          )}
        </div>
      </footer>
    </div>
  );
};
