
export interface User {
  id: string;
  name: string;
  avatar: string;
  knows: string[];
  wants: string[];
  credits: number;
  bio: string;
  redeemedResources: string[]; // List of IDs for quick lookup
  purchaseHistory: RedemptionRecord[]; // Detailed history
}

export interface RedemptionRecord {
  resourceId: string;
  timestamp: number;
  cost: number;
}

export interface Match {
  id: string;
  peer: User;
  type: 'perfect_swap' | 'one_way';
  sharedInterests: string[];
}

export interface Resource {
  id: string;
  title: string;
  author: string;
  authorId?: string;
  type: 'video' | 'notes' | 'guide' | 'lesson_plan';
  cost: number;
  category: string;
  thumbnail: string;
  rating?: number;
  totalRatings?: number; // Needed to compute new average
  enrolled?: number;
  content?: string;
}

export interface TeachingRequest {
  id: string;
  studentId: string;
  studentName: string;
  skillNeeded: string;
  reward: number;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export interface Conversation {
  userId: string;
  lastMessage: string;
  timestamp: number;
}
