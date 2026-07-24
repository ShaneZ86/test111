import React, { useState } from 'react';
import { PageView } from '../types';
import { TikTokLogo } from './TikTokLogo';
import { AGENT_AVATAR } from '../utils/orderNumber';

interface ServiceEvaluationPageProps {
  onNavigate: (page: PageView) => void;
  showToast: (msg: string) => void;
}

const HIGHLIGHT_TAGS = ['态度好', '专业性强', '解决迅速', '沟通顺畅', '回复及时', '耐心细致'];
const RATING_TEXTS = ['', '非常不满意', '不满意', '一般', '满意', '非常满意'];

export const ServiceEvaluationPage: React.FC<ServiceEvaluationPageProps> = ({
  onNavigate,
  showToast,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
    }
  };

  const handleSubmit = () => {
    if (rating === 0) {
      showToast('请点击星星先进行打分哦');
      return;
    }
    showToast('评价提交成功！感谢您的反馈');
    setTimeout(() => {
      onNavigate('chat');
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9fc] text-[#1a1c1e] mobile-scroll">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#e2e2e5] px-4 h-14 flex items-center">
        <button
          onClick={() => onNavigate('chat')}
          className="material-symbols-outlined text-[#0050cb] p-2 hover:bg-[#f3f3f6] rounded-full active:scale-95 transition-all cursor-pointer"
          aria-label="返回"
        >
          arrow_back
        </button>
        <TikTokLogo className="w-5 h-5 ml-1.5 mr-2" />
        <h1 className="font-bold text-[17px] text-[#1a1c1e]">服务评价</h1>
      </header>

      {/* Main Form Content */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-6 flex flex-col pb-10">
        {/* Service Agent Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-sm mb-3">
            <img src={AGENT_AVATAR} onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }} alt="客服头像" className="w-full h-full object-cover" />
          </div>
          <p className="text-[13px] text-[#585f66] font-medium">正在评价：客服专员 小林</p>
          <h2 className="text-[20px] font-bold text-[#1a1c1e] mt-1.5">您对本次服务满意吗？</h2>
        </div>

        {/* Rating Stars Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#e2e2e5] mb-6 flex flex-col items-center shadow-2xs">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const isFilled = star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="material-symbols-outlined text-[42px] hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                  style={{
                    color: isFilled ? '#ffaa00' : '#c2c6d8',
                    fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0",
                  }}
                >
                  star
                </button>
              );
            })}
          </div>
          <p
            className={`mt-3 text-[14px] font-medium transition-colors ${
              rating === 0
                ? 'text-[#0050cb]'
                : rating <= 2
                ? 'text-[#ba1a1a]'
                : 'text-[#0050cb]'
            }`}
          >
            {rating === 0 ? '点击星星进行评分' : RATING_TEXTS[rating]}
          </p>
        </div>

        {/* Service Highlight Tags */}
        <div className="mb-6">
          <h3 className="text-[14px] font-semibold text-[#1a1c1e] mb-3">服务亮点</h3>
          <div className="flex flex-wrap gap-2.5">
            {HIGHLIGHT_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-[13px] font-medium border transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'bg-[#0050cb] text-white border-[#0050cb] shadow-xs'
                      : 'bg-white text-[#424656] border-[#c2c6d8] hover:border-[#0050cb]/50 hover:bg-[#f3f3f6]'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detailed Feedback Input */}
        <div className="mb-8">
          <h3 className="text-[14px] font-semibold text-[#1a1c1e] mb-3">详细评价</h3>
          <div className="relative">
            <textarea
              rows={5}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value.slice(0, 500))}
              placeholder="请输入您的评价内容，您的反馈将帮助我们不断进步..."
              className="w-full rounded-xl border border-[#c2c6d8] bg-white p-4 text-[16px] sm:text-[14px] focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20 transition-all resize-none outline-none text-[#1a1c1e]"
              maxLength={500}
            />
            <div className="absolute bottom-3 right-4 text-[12px] text-[#727687]">
              <span>{feedback.length}</span>/500
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0050cb] text-white font-bold text-[16px] py-3.5 rounded-xl shadow-md hover:bg-[#0050cb]/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            提交评价
          </button>
          <p className="text-center mt-3 text-[12px] text-[#727687]">
            感谢您的真实评价，我们会认真对待每一条反馈
          </p>
        </div>
      </main>
    </div>
  );
};
