export type PageView = 'chat' | 'evaluation' | 'overview' | 'leave_message' | 'agent_workbench';

export interface RefundCardData {
  amount: string;
  path: string;
}

export interface ChatMessage {
  id: string;
  sender: 'agent' | 'user' | 'system';
  agentName?: string;
  agentAvatar?: string;
  userAvatar?: string;
  text: string;
  refundCard?: RefundCardData;
  imageUrl?: string;
  linkUrl?: string;
  linkTitle?: string;
  timestamp: string;
  isRead?: boolean;
}

export interface ChatSession {
  id: string;
  name: string;
  avatar: string;
  unreadCount?: number;
  lastMessage: string;
  time: string;
  isActive?: boolean;
}

export interface EvaluationData {
  rating: number;
  tags: string[];
  feedback: string;
}

export interface LeaveMessageData {
  category: string;
  description: string;
  images: string[];
  contact: string;
}
