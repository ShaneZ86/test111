import React, { useState, useRef } from 'react';
import { PageView } from '../types';
import { TikTokLogo } from './TikTokLogo';
import { AGENT_AVATAR } from '../utils/orderNumber';

interface LeaveMessagePageProps {
  onNavigate: (page: PageView) => void;
  showToast: (msg: string) => void;
}

const CATEGORIES = ['退款问题', '咨询建议', '账户异常', '其他'];

export const LeaveMessagePage: React.FC<LeaveMessagePageProps> = ({
  onNavigate,
  showToast,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('退款问题');
  const [description, setDescription] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (uploadedImages.length >= 4) {
      showToast('最多允许上传4张凭证图片');
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImages((prev) => [...prev, event.target!.result as string].slice(0, 4));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!description.trim()) {
      showToast('请填写详细描述（必填项）');
      return;
    }

    showToast('留言已提交成功，客服将在10分钟内响应');
    setTimeout(() => {
      onNavigate('chat');
    }, 800);
  };

  return (
    <div className="flex flex-col h-full bg-[#f9f9fc] text-[#1a1c1e] mobile-scroll">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#c2c6d8] px-4 h-14 flex items-center">
        <button
          onClick={() => onNavigate('chat')}
          className="material-symbols-outlined text-[#0050cb] p-2 hover:bg-[#f3f3f6] rounded-full active:scale-95 transition-all cursor-pointer"
          aria-label="返回"
        >
          arrow_back
        </button>
        <TikTokLogo className="w-5 h-5 ml-1.5 mr-2" />
        <h1 className="font-bold text-[17px] text-[#1a1c1e]">给客服留言</h1>
      </header>

      <input
        type="file"
        ref={imageInputRef}
        accept="image/*"
        onChange={handleImageAdd}
        className="hidden"
      />

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 flex flex-col gap-6 pb-24">
        {/* Agent Info Banner Box */}
        <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-6 flex flex-col items-center text-center border border-[#c2c6d8] shadow-2xs">
          <div className="w-24 h-24 mb-4 rounded-full overflow-hidden border-4 border-white shadow-sm">
            <img src={AGENT_AVATAR} onError={(e) => { e.currentTarget.src = AGENT_AVATAR; }} alt="客服头像" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-[18px] font-bold text-[#0050cb] mb-1.5">人工客服正在忙碌</h2>
          <p className="text-[14px] text-[#424656] max-w-sm leading-relaxed">
            当前人工忙，您可以先在此留言。我们会按照留言顺序尽快处理您的请求。
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3 w-full max-w-sm">
            <div className="flex flex-col items-center p-2.5 bg-[#f3f3f6] rounded-xl border border-[#c2c6d8]/50">
              <span className="material-symbols-outlined text-[#0050cb] mb-0.5 text-[20px]">timer</span>
              <span className="text-[12px] font-medium text-[#5e656c]">10min内</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-[#f3f3f6] rounded-xl border border-[#c2c6d8]/50">
              <span className="material-symbols-outlined text-[#0050cb] mb-0.5 text-[20px]">verified_user</span>
              <span className="text-[12px] font-medium text-[#5e656c]">官方处理</span>
            </div>
            <div className="flex flex-col items-center p-2.5 bg-[#f3f3f6] rounded-xl border border-[#c2c6d8]/50">
              <span className="material-symbols-outlined text-[#0050cb] mb-0.5 text-[20px]">mark_email_read</span>
              <span className="text-[12px] font-medium text-[#5e656c]">反馈通知</span>
            </div>
          </div>
        </div>

        {/* Section 1: Category Selection */}
        <div className="bg-white border border-[#c2c6d8] rounded-2xl p-5 shadow-2xs">
          <label className="text-[14px] font-semibold text-[#1a1c1e] block mb-3">请选择留言类型</label>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'border-[#0050cb] bg-[#0050cb]/5 text-[#0050cb] shadow-2xs'
                      : 'border-[#c2c6d8] text-[#424656] hover:border-[#0050cb]/40 hover:bg-[#f3f3f6]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Detailed Description */}
        <div className="bg-white border border-[#c2c6d8] rounded-2xl p-5 shadow-2xs">
          <label className="text-[14px] font-semibold text-[#1a1c1e] block mb-3" htmlFor="desc-input">
            详细描述 (必填)
          </label>
          <textarea
            id="desc-input"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="请详细描述您遇到的问题，以便我们为您快速处理..."
            className="w-full bg-[#f3f3f6] border border-[#c2c6d8] focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20 rounded-xl p-3.5 text-[16px] sm:text-[14px] text-[#1a1c1e] outline-none transition-colors resize-none"
            maxLength={500}
          />
          <div className="flex justify-end mt-2">
            <span className="text-[12px] text-[#727687]">
              <span>{description.length}</span>/500
            </span>
          </div>
        </div>

        {/* Section 3: Image Upload */}
        <div className="bg-white border border-[#c2c6d8] rounded-2xl p-5 shadow-2xs">
          <label className="text-[14px] font-semibold text-[#1a1c1e] block mb-3">
            上传凭证/图片 (选填，最多4张)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {uploadedImages.map((imgUrl, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-[#c2c6d8]">
                <img src={imgUrl} alt={`Uploaded ${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 material-symbols-outlined text-[16px] hover:bg-red-600 transition-colors"
                >
                  close
                </button>
              </div>
            ))}

            {uploadedImages.length < 4 && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="aspect-square bg-[#f3f3f6] border-2 border-dashed border-[#c2c6d8] rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/50 hover:border-[#0050cb]/60 transition-all group"
              >
                <span className="material-symbols-outlined text-3xl text-[#727687] group-hover:text-[#0050cb] mb-1">
                  add
                </span>
                <span className="text-[12px] text-[#727687] group-hover:text-[#0050cb] font-medium">
                  上传图片
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Contact Info */}
        <div className="bg-white border border-[#c2c6d8] rounded-2xl p-5 shadow-2xs">
          <label className="text-[14px] font-semibold text-[#1a1c1e] block mb-3" htmlFor="contact-input">
            联系电话/邮箱 (选填)
          </label>
          <input
            id="contact-input"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="留下您的联系方式，方便我们回访"
            className="w-full bg-[#f3f3f6] border border-[#c2c6d8] focus:border-[#0050cb] focus:ring-2 focus:ring-[#0050cb]/20 rounded-xl h-11 px-4 text-[16px] sm:text-[14px] text-[#1a1c1e] outline-none transition-colors"
          />
        </div>

        {/* Action Submit Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#0050cb] text-white font-bold text-[16px] py-3.5 rounded-xl shadow-md hover:bg-[#0050cb]/90 active:scale-[0.98] transition-all cursor-pointer"
          >
            提交留言
          </button>
        </div>
      </main>
    </div>
  );
};
