import React, { useMemo, useState, useRef, useEffect } from 'react';
import { PageView, ChatMessage } from '../types';
import { AGENT_AVATAR, USER_AVATAR } from '../utils/orderNumber';
import { getCustomerServiceReply } from '../utils/replyEngine';
import { TikTokLogo } from './TikTokLogo';

interface CustomerServiceOverviewPageProps {
  orderNumber: string;
  onNavigate: (page: PageView) => void;
  showToast: (msg: string) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export const CustomerServiceOverviewPage: React.FC<CustomerServiceOverviewPageProps> = ({
  orderNumber,
  onNavigate,
  showToast,
  messages,
  setMessages,
}) => {
  const { timeStr, fullTimeStr1, fullTimeStr2 } = useMemo(() => {
    const now = new Date();
    const YYYY = now.getFullYear();
    const MM = String(now.getMonth() + 1).padStart(2, '0');
    const DD = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');

    // Time 5 mins ago
    const t1 = new Date(now.getTime() - 5 * 60 * 1000);
    const hh1 = String(t1.getHours()).padStart(2, '0');
    const mm1 = String(t1.getMinutes()).padStart(2, '0');

    return {
      timeStr: `${hh}:${mm}`,
      fullTimeStr1: `${YYYY}-${MM}-${DD} ${hh1}:${mm1}`,
      fullTimeStr2: `${YYYY}-${MM}-${DD} ${hh}:${mm}`,
    };
  }, []);

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const EMOJI_LIST = ['😊', '😂', '👍', '🙏', '❤️', '😭', '😮', '🤔', '👌', '🎉', '✨', '⏰'];

  // Auto scroll to bottom of the chat list on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
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
    const timeStrResult = `${hours}:${minutes} · 已送达`;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      userAvatar: USER_AVATAR,
      text,
      timestamp: timeStrResult,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imgDataUrl = event.target?.result as string;
      const now = new Date();
      const timeStrResult = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')} · 已送达`;

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        sender: 'user',
        userAvatar: USER_AVATAR,
        text: '[图片]',
        imageUrl: imgDataUrl,
        timestamp: timeStrResult,
        isRead: true,
      };

      setMessages((prev) => [...prev, userMsg]);
      showToast('图片已发送');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const addEmoji = (emoji: string) => {
    setInputText((prev) => prev + emoji);
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9fc] text-[#1a1c1e] overflow-hidden">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e2e6] px-4 h-14 flex items-center justify-between">
        <button
          onClick={() => onNavigate('chat')}
          className="text-[#0066ff] p-2 hover:bg-[#f3f3f6] rounded-full active:scale-95 transition-all cursor-pointer flex items-center"
          aria-label="返回"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back_ios</span>
        </button>
        <div className="flex items-center gap-2">
          <TikTokLogo className="w-6 h-6" />
          <div className="flex flex-col items-start">
            <h1 className="font-bold text-[16px] text-[#1a1c1e] leading-tight">抖音客服 - 顾客服务中心</h1>
            <span className="text-[11px] text-emerald-600 font-medium">官方服务专家小林 - 在线服务中</span>
          </div>
        </div>
        <button
          onClick={() => showToast('已刷新客服工单状态')}
          className="text-[#0066ff] p-2 hover:bg-[#f3f3f6] rounded-full active:scale-95 transition-all cursor-pointer flex items-center"
          aria-label="更多"
        >
          <span className="material-symbols-outlined text-[22px]">more_horiz</span>
        </button>
      </header>

      {/* Main Canvas Content */}
      <main className="flex-1 overflow-y-auto mobile-scroll max-w-xl w-full mx-auto px-4 py-6 flex flex-col gap-6 pb-4">
        {/* System Time Pill */}
        <div className="flex justify-center">
          <span className="bg-[#e2e2e6]/50 text-[#44474e] text-[12px] px-3.5 py-1 rounded-full font-medium">
            {timeStr}
          </span>
        </div>

        {/* Service Message 1 (Complex Action Card) */}
        <div className="flex gap-3 items-start max-w-[92%]">
          <img
            src={AGENT_AVATAR}
            onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }}
            alt="Bot Avatar"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-2xs border border-[#e2e2e6]"
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#e2e2e6]">
              <p className="text-[14px] text-[#1a1c1e] mb-3 leading-normal">
                您的服务正在进行中，您可根据下方按钮选择想要的操作：
              </p>

              <div className="flex justify-between items-center mb-2.5">
                <span className="font-bold text-[14px] text-[#1a1c1e]">退款问题咨询</span>
                <span className="bg-[#0066ff]/10 text-[#0066ff] font-semibold text-[12px] px-2 py-0.5 rounded">
                  处理中
                </span>
              </div>

              {/* Inner Status Card */}
              <div className="bg-[#f3f3f6] rounded-xl p-3 mb-4 border border-[#e2e2e6]/50">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-[#0066ff] text-[18px]">info</span>
                  <span className="font-bold text-[12px] text-[#0066ff]">客服跟进</span>
                  <span className="text-[11px] text-[#535f70] ml-auto">{fullTimeStr1}</span>
                </div>
                <p className="text-[12px] text-[#535f70] leading-relaxed">
                  您的问题已分配给专属客服，客服即将与您取得联系
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => onNavigate('leave_message')}
                  className="flex-1 bg-white border border-[#c4c6cf] text-[#0066ff] font-bold text-[13px] py-2 rounded-lg hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                >
                  给客服留言
                </button>
                <button
                  onClick={() => onNavigate('chat')}
                  className="flex-1 bg-white border border-[#c4c6cf] text-[#0066ff] font-bold text-[13px] py-2 rounded-lg hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                >
                  联系客服
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex justify-center my-1">
          <span className="text-[#535f70] text-[12px] font-medium">
            {fullTimeStr2}
          </span>
        </div>

        {/* Service Message 2 (Official Agent Welcome Greeting) */}
        <div className="flex gap-3 items-start max-w-[92%]">
          <img
            src={AGENT_AVATAR}
            onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }}
            alt="Human Agent Avatar"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0 shadow-2xs border border-[#e2e2e6]"
          />
          <div className="flex flex-col gap-2 w-full">
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-[#e2e2e6]">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-[14px] text-[#1a1c1e]">官方客服-小林</span>
                <span className="bg-blue-50 text-[#0066ff] text-[11px] font-semibold px-2 py-0.5 rounded border border-blue-200">
                  服务专家
                </span>
              </div>
              <p className="text-[14px] text-[#1a1c1e] mb-3 leading-relaxed bg-[#f3f3f6] p-3 rounded-xl border border-[#e2e2e6]/60">
                您好，我是抖音官方服务专家小林，很高兴为您服务。
              </p>
              <button
                onClick={() => onNavigate('chat')}
                className="w-full bg-[#0066ff] text-white font-bold text-[13px] py-2.5 rounded-xl hover:bg-[#0050cb] active:scale-95 transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>点击与小林在线沟通</span>
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Conversation History (skipping the first welcome greeting) */}
        {messages.slice(1).length > 0 && (
          <div className="flex flex-col gap-5 mt-4 pt-4 border-t border-[#e2e2e6]/60">
            <div className="flex justify-center">
              <span className="text-[#8e9099] text-[11px] font-medium tracking-wide bg-[#eeeef0] px-3.5 py-1 rounded-full shadow-2xs">
                以下为最新沟通记录
              </span>
            </div>
            
            {messages.slice(1).map((msg) => {
              if (msg.sender === 'agent') {
                return (
                  <div key={msg.id} className="flex items-start gap-2.5 max-w-[92%] self-start animate-in fade-in-50 duration-200">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-2xs border border-[#e2e2e6] bg-white">
                      <img
                        src={msg.agentAvatar || AGENT_AVATAR}
                        onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }}
                        alt="Agent Avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="text-[12px] text-[#585f66] px-0.5">{msg.agentName || '官方客服-小林'}</span>
                      <div className="message-bubble-agent bg-[#e2e2e5] border border-[#c2c6d8] text-[#1a1c1e] p-3 shadow-2xs text-[14px] sm:text-[15px] rounded-2xl rounded-tl-none leading-relaxed">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
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
                <div key={msg.id} className="flex items-start gap-2.5 max-w-[92%] self-end flex-row-reverse animate-in fade-in-50 duration-200">
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-2xs border border-blue-200 bg-white">
                    <img
                      src={msg.userAvatar || USER_AVATAR}
                      onError={(e) => { e.currentTarget.src = USER_AVATAR; }}
                      alt="User Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-end min-w-0">
                    <div className="message-bubble-user bg-[#0050cb] text-white p-3 shadow-sm text-[14px] sm:text-[15px] rounded-2xl rounded-tr-none leading-relaxed">
                      {msg.imageUrl ? (
                        <img
                          src={msg.imageUrl}
                          alt="Uploaded attachment"
                          className="max-w-[180px] max-h-[180px] rounded-lg object-cover border border-white/20"
                        />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                    <span className="text-[11px] text-[#727687] px-1 mt-0.5 text-right">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}


        {/* Real-time typing indicator is removed as requested */}

        <div ref={chatBottomRef} />
      </main>

      {/* Sticky Bottom Input Area & Toolbar */}
      <footer className="shrink-0 z-40 bg-white border-t border-[#e2e2e5] flex flex-col pb-safe w-full max-w-xl mx-auto rounded-t-xl shadow-md">
        {/* Emoji Picker Drawer */}
        {showEmojiPicker && (
          <div className="bg-[#f3f3f6] border-b border-[#e2e2e5] p-3 grid grid-cols-6 gap-2 max-h-40 overflow-y-auto">
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
        <div className="flex items-center gap-2 px-3 py-2.5 w-full">
          {/* Toolbar Icons */}
          <div className="flex items-center gap-0.5">
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
                setShowEmojiPicker(false);
                setTimeout(() => {
                  if (chatBottomRef.current) {
                    chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
                  }
                }, 150);
              }}
              placeholder="输入消息，在此直接对话..."
              className="w-full bg-[#f3f3f6] border-none rounded-xl pl-4 pr-10 py-2.5 text-[16px] sm:text-[15px] focus:ring-2 focus:ring-[#0050cb]/20 focus:bg-white transition-all outline-none text-[#1a1c1e]"
            />
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className={`absolute right-2.5 material-symbols-outlined text-[20px] sm:text-[22px] cursor-pointer transition-colors ${
                showEmojiPicker ? 'text-[#0050cb]' : 'text-[#585f66] hover:text-[#0050cb]'
              }`}
              title="表情包"
            >
              sentiment_satisfied
            </button>
          </div>

          {/* Send Button */}
          <button
            onClick={() => handleSendMessage()}
            className={`p-2 rounded-full active:scale-90 transition-transform cursor-pointer flex items-center justify-center shrink-0 ${
              inputText.trim() ? 'bg-[#0050cb] text-white shadow-xs' : 'bg-transparent text-[#9a9a9a]'
            }`}
            disabled={!inputText.trim()}
            title="发送消息"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
};

