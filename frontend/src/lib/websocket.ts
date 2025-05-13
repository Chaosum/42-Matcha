export type WsMessage = {
  message: string;
  data: ChatMessage[] | ChatMessage | Notification | Notification[];
};

export type ChatMessage = {
  receiverUsername: string;
  content: string;
  timestamp: Date;
};

export type Notification = {
  isRead: number;
  content: string;
  timestamp: string;
};
