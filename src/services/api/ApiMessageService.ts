import { MessageService, MessageListResult } from '../interfaces/MessageService';
import { Message } from '../../models/Message';
import { AWS_CONFIG } from '../../config/config';

const API_BASE = AWS_CONFIG.presignApi.url;


export class ApiMessageService implements MessageService {
  private subscribers: Map<string, Set<(messages: Message[]) => void>>;
  private pollingIntervals: Map<string, ReturnType<typeof setInterval>>;
  private lastMessageCount: Map<string, number>;

  constructor() {
    this.subscribers = new Map();
    this.pollingIntervals = new Map();
    this.lastMessageCount = new Map();
  }

  private async fetchMessages(groupId: string): Promise<Message[]> {
    try {
      const response = await fetch(`${API_BASE}/messages/${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  private notifySubscribers(groupId: string, messages: Message[]): void {
    const callbacks = this.subscribers.get(groupId);
    callbacks?.forEach((callback) => callback(messages));
  }

  private startPolling(groupId: string): void {
    this.stopPolling(groupId);

    // Initial fetch
    this.fetchMessages(groupId).then((messages) => {
      this.lastMessageCount.set(groupId, messages.length);
      this.notifySubscribers(groupId, messages);
    });

    // Poll every 1 second
    const interval = setInterval(async () => {
      const messages = await this.fetchMessages(groupId);
      const currentCount = messages.length;
      const lastCount = this.lastMessageCount.get(groupId) || 0;

      if (currentCount !== lastCount) {
        this.lastMessageCount.set(groupId, currentCount);
        this.notifySubscribers(groupId, messages);
      }
    }, 1000);

    this.pollingIntervals.set(groupId, interval);
  }

  private stopPolling(groupId: string): void {
    const interval = this.pollingIntervals.get(groupId);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(groupId);
    }
  }

  async listMessages(groupId: string, limit?: number): Promise<MessageListResult> {
    let messages = await this.fetchMessages(groupId);

    // Sort newest first
    messages = messages.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    if (limit) {
      messages = messages.slice(0, limit);
    }

    return {
      messages,
      nextToken: undefined,
      hasMore: false,
    };
  }

  async sendMessage(
    groupId: string,
    text: string | null,
    senderId: string,
    senderDisplayName: string,
    attachments?: Message['attachments']
  ): Promise<Message> {
    try {
      const body: Record<string, unknown> = {
        text: text ?? null,
        senderId,
        senderDisplayName,
        attachments,
      };

      const response = await fetch(`${API_BASE}/messages/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const message = await response.json();

      // Refresh messages
      const messages = await this.fetchMessages(groupId);
      this.notifySubscribers(groupId, messages);

      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  subscribeToMessages(groupId: string, callback: (messages: Message[]) => void): () => void {
    if (!this.subscribers.has(groupId)) {
      this.subscribers.set(groupId, new Set());
    }

    this.subscribers.get(groupId)!.add(callback);

    // Start polling on first subscriber
    if (this.subscribers.get(groupId)!.size === 1) {
      this.startPolling(groupId);
    }

    // Initial load
    this.fetchMessages(groupId).then(callback);

    // Cleanup
    return () => {
      const callbacks = this.subscribers.get(groupId);
      if (!callbacks) return;

      callbacks.delete(callback);

      if (callbacks.size === 0) {
        this.stopPolling(groupId);
        this.subscribers.delete(groupId);
      }
    };
  }
}
