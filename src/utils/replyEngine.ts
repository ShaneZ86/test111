import { RefundCardData } from '../types';

export interface AutoReplyResponse {
  text: string;
  refundCard?: RefundCardData;
}

export function getCustomerServiceReply(userText: string, orderNumber: string): AutoReplyResponse {
  const query = userText.toLowerCase().trim();

  if (query.includes('到账') || query.includes('时间') || query.includes('什么时候') || query.includes('多久')) {
    return {
      text: `已为您优先查询最新退款进度。审核已通过，款项预计在1-3个工作日内自动原路退还至您的支付账户。请您耐心等待银行或支付平台入账通知。`,
      refundCard: {
        amount: "¥199.00",
        path: "微信支付"
      }
    };
  }

  if (query.includes('发票') || query.includes('开票')) {
    return {
      text: `退款成功后，原购买订单的发票会自动作废冲红。如您需要退款凭证或电子红字发票存根，可在【服务评价】后点击【申请凭证】导出。`
    };
  }

  if (query.includes('人工') || query.includes('转人工') || query.includes('客服')) {
    return {
      text: `专员小林正在为您实时在线服务。您也可以点击下方的【给客服留言】按钮提交详细诉求，专员将在10分钟内优先跟进回复。`
    };
  }

  if (query.includes('微信') || query.includes('支付宝') || query.includes('银行卡') || query.includes('卡')) {
    return {
      text: `您的退款金额 ¥199.00 将通过【微信支付】原路退回。若遇到零钱或银行卡异常，系统会自动转至您的抖音钱包余额中。`
    };
  }

  if (query.includes('加急') || query.includes('催') || query.includes('快')) {
    return {
      text: `已为您在系统后管成功标记【特急催办】！退款流水号已提至优先清算通道，请留意微信支付入账提醒。`
    };
  }

  if (query.includes('谢谢') || query.includes('感谢') || query.includes('好的') || query.includes('收到') || query.includes('OK')) {
    return {
      text: `不客气呢！很高兴能帮到您。如果您对本次服务满意，非常欢迎点击上方的【评价服务】给予鼓励哦！祝您生活愉快！`
    };
  }

  // Default friendly response
  return {
    text: `收到您的消息！关于本次退款事宜，专员小林已为您记录。审核状态正常，预计1-3个工作日到账，如有其他问题请随时告诉我。`
  };
}
