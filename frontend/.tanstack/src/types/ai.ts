export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatDto {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  reply: string;
  sessionId: string;
  model: string;
  intent: string;
}
