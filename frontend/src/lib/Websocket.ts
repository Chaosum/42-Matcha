// the following forms are similar
export const wsUrl = "ws://localhost:5163/ws";

export type WsMessage = {
  Message: string;
  Data: ChatMessage | Notification;
}

export type ChatMessage = {
  ReceiverId: number;
  Message: string;
  Timestamp: string;
}

export type Notification = {
  status: number;
  content: string;
  timestamp: string;
}