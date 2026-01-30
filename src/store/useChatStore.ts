import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Group } from '../models/Group';
import { Message } from '../models/Message';
import { createGroupService, createMessageService } from '../services/config';
import { useAuthStore } from './useAuthStore';

interface ChatState {
  groups: Group[];
  currentGroupId: string | null;
  messages: Message[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMoreMessages: boolean;
  nextToken: string | undefined;
  groupService: ReturnType<typeof createGroupService>;
  messageService: ReturnType<typeof createMessageService>;
  unsubscribe: (() => void) | null;

  loadGroups: () => Promise<void>;
  setCurrentGroup: (groupId: string) => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  sendMessage: (text: string | null, attachments?: Message['attachments']) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>(
  
    (set, get) => ({
      groups: [],
      currentGroupId: null,
      messages: [],
      isLoading: false,
      isLoadingMore: false,
      hasMoreMessages: false,
      nextToken: undefined,
      groupService: createGroupService(),
      messageService: createMessageService(),
      unsubscribe: null,

      loadGroups: async () => {
        const { groupService } = get();
        const groups = await groupService.listGroups();
        set({ groups });

        if (groups.length > 0 && !get().currentGroupId) {
          get().setCurrentGroup(groups[0].id);
        }
      },

      setCurrentGroup: async (groupId: string) => {
        const { messageService, unsubscribe } = get();

        if (unsubscribe) unsubscribe();

        set({ isLoading: true, messages: [], nextToken: undefined, hasMoreMessages: false });

        try {
          const result = await messageService.listMessages(groupId, 30);
          const reversedMessages = [...result.messages].reverse();
          const uniqueMessages = Array.from(
            new Map(reversedMessages.map(m => [m.id, m])).values()
          );

          const cleanup = messageService.subscribeToMessages(groupId, (newMessages) => {
            const currentMessages = get().messages;
            const messageIds = new Set(currentMessages.map(m => m.id));
            const uniqueNewMessages = newMessages.filter(m => !messageIds.has(m.id));
            const allMessages = [...currentMessages, ...uniqueNewMessages];
            const uniqueAllMessages = Array.from(
              new Map(allMessages.map(m => [m.id, m])).values()
            );
            set({ messages: uniqueAllMessages });
          });

          set({
            currentGroupId: groupId,
            messages: uniqueMessages,
            nextToken: result.nextToken,
            hasMoreMessages: result.hasMore,
            unsubscribe: cleanup,
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to load messages:', error);
          set({ isLoading: false });
        }
      },

      loadMoreMessages: async () => {
        const { messageService, currentGroupId, nextToken, isLoadingMore, messages } = get();

        if (!currentGroupId || !nextToken || isLoadingMore) return;

        set({ isLoadingMore: true });

        try {
          const result = await messageService.listMessages(currentGroupId, 30, nextToken);
          const reversedNewMessages = [...result.messages].reverse();
          const allMessages = [...reversedNewMessages, ...messages];
          const uniqueMessages = Array.from(
            new Map(allMessages.map(m => [m.id, m])).values()
          );

          set({
            messages: uniqueMessages,
            nextToken: result.nextToken,
            hasMoreMessages: result.hasMore,
            isLoadingMore: false,
          });
        } catch (error) {
          console.error('Failed to load more messages:', error);
          set({ isLoadingMore: false });
        }
      },

      sendMessage: async (text: string | null, attachments?: Message['attachments']) => {
        const { messageService, currentGroupId, messages } = get();
        const { user } = useAuthStore.getState();

        if (!currentGroupId || !user || (!text?.trim() && !(attachments?.length))) {
          console.warn('sendMessage: Missing data', { currentGroupId, user, text, attachments });
          return;
        }

        const tempMessage: Message = {
          id: `temp-${Date.now()}`,
          groupId: currentGroupId,
          senderId: user.userId,
          senderDisplayName: user.displayName,
          text: text?.trim() || null,
          attachments: attachments || null,
          createdAt: new Date().toISOString(),
          status: 'sending',
        };
        set({ messages: [...messages, tempMessage] });

        try {
          const sentMessage = await messageService.sendMessage(
            currentGroupId,
            text?.trim() || null,
            user.userId,
            user.displayName,
            attachments
          );

          const currentMessages = get().messages;
          const updatedMessages = currentMessages.map(m =>
            m.id === tempMessage.id ? { ...sentMessage, status: 'sent' } : m
          );

          set({ messages: Array.from(new Map(updatedMessages.map(m => [m.id, m])).values()) });
        } catch (error: any) {
          console.error('Failed to send message:', error);
          const currentMessages = get().messages;
          const updatedMessages = currentMessages.filter(m => m.id !== tempMessage.id);
          set({ messages: updatedMessages });

          if (error?.networkError || error?.message?.includes('Failed to fetch') || error?.name === 'NetworkError') {
            const networkError = new Error('No internet connection. Please check your network and try again.');
            networkError.name = 'NetworkError';
            throw networkError;
          }

          throw error;
        }
      },

      clearMessages: () => {
        const { unsubscribe } = get();
        if (unsubscribe) unsubscribe();
        set({ messages: [], currentGroupId: null, unsubscribe: null });
      },
    }),
);
