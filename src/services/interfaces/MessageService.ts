import { Message } from '../../models/Message';

export interface MessageListResult {
  messages: Message[];
  nextToken?: string;
  hasMore: boolean;
}

export interface MessageService {
  /**
   * List messages for a group with pagination support.
   * @param groupId - The group ID
   * @param limit - Maximum number of messages to return (default: 30)
   * @param nextToken - Token for pagination (for loading older messages)
   * @returns Messages and pagination info. Messages are returned in reverse chronological order (newest first).
   */
  listMessages(groupId: string, limit?: number, nextToken?: string): Promise<MessageListResult>;
  /**
   * Send a message to a group.
   * @param groupId - The group ID
   * @param text - Message text (optional if attachments are provided)
   * @param senderId - Sender user ID
   * @param senderDisplayName - Sender display name
   * @param attachments - Optional array of attachments (Stage 5)
   */
  sendMessage(
    groupId: string, 
    text: string | null, 
    senderId: string, 
    senderDisplayName: string,
    attachments?: import('../../models/Message').Attachment[]
  ): Promise<Message>;
  subscribeToMessages(groupId: string, callback: (messages: Message[]) => void): () => void;
}
