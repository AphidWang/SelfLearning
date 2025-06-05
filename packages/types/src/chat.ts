export interface Contact {
  id: string;
  name: string;
  avatar?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
}
