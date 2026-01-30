export type MessageStatus = 'sending' | 'sent' | 'failed';

export interface Attachment {
  bucket: string;
  key: string;
  contentType: string;
  originalFileName?: string;
  sizeBytes?: number;
  uploadedAt: string; // ISO string
}

export interface Message {
  id: string;
  groupId: string;
  senderId: string;
  senderDisplayName: string;
  text?: string | null;
  attachments?: Attachment[] | null;
  createdAt: string; // ISO string
  status: MessageStatus;
}
