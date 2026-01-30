import { MessageService, MessageListResult } from '../interfaces/MessageService';
import { Message } from '../../models/Message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY_MESSAGES = 'chat_app_messages';

// Seed starter messages
const SEEDED_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    groupId: 'demo-group',
    senderId: 'person1',
    senderDisplayName: 'Person One',
    text: 'Hello! Welcome to the demo group chat.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'sent',
  },
  {
    id: 'msg-2',
    groupId: 'demo-group',
    senderId: 'person2',
    senderDisplayName: 'Person Two',
    text: 'Hi there! This is great.',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: 'sent',
  },
];

export class LocalMessageService implements MessageService {
  private subscribers: Map<string, Set<(messages: Message[]) => void>> = new Map();

  constructor() {
    this.initializeMessages();
  }

  // Initialize messages storage
  private async initializeMessages(): Promise<void> {
    const existing = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!existing) {
      await AsyncStorage.setItem(
        STORAGE_KEY_MESSAGES,
        JSON.stringify(SEEDED_MESSAGES)
      );
    }
  }

  private async getMessagesFromStorage(groupId: string): Promise<Message[]> {
    try {
      const messagesJson = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
      if (!messagesJson) return [];

      const allMessages: Message[] = JSON.parse(messagesJson);

      return allMessages
        .filter((m) => m.groupId === groupId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        );
    } catch {
      return [];
    }
  }

  private async saveMessagesToStorage(messages: Message[]): Promise<void> {
    await AsyncStorage.setItem(
      STORAGE_KEY_MESSAGES,
      JSON.stringify(messages)
    );
  }

  private async notifySubscribers(groupId: string): Promise<void> {
    const callbacks = this.subscribers.get(groupId);
    if (!callbacks) return;

    const messages = await this.getMessagesFromStorage(groupId);
    callbacks.forEach((cb) => cb(messages));
  }

  async listMessages(
    groupId: string,
    limit?: number
  ): Promise<MessageListResult> {
    let messages = await this.getMessagesFromStorage(groupId);

    // Newest first
    messages = messages.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
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
    text: string,
    senderId: string,
    senderDisplayName: string
  ): Promise<Message> {
    const message: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      groupId,
      senderId,
      senderDisplayName,
      text,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };

    const messagesJson = await AsyncStorage.getItem(STORAGE_KEY_MESSAGES);
    const allMessages: Message[] = messagesJson ? JSON.parse(messagesJson) : [];

    allMessages.push(message);
    await this.saveMessagesToStorage(allMessages);

    await this.notifySubscribers(groupId);

    return message;
  }

  subscribeToMessages(
    groupId: string,
    callback: (messages: Message[]) => void
  ): () => void {
    if (!this.subscribers.has(groupId)) {
      this.subscribers.set(groupId, new Set());
    }

    this.subscribers.get(groupId)!.add(callback);

    // Load initial messages
    this.getMessagesFromStorage(groupId).then(callback);

    return () => {
      const callbacks = this.subscribers.get(groupId);
      if (!callbacks) return;

      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.subscribers.delete(groupId);
      }
    };
  }
}
