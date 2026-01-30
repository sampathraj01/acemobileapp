import { MessageService, MessageListResult } from '../interfaces/MessageService';
import { Message } from '../../models/Message';
import { apolloClient } from './apollo-client';
import {
  LIST_MESSAGES,
  SEND_MESSAGE,
  ON_MESSAGE_SENT,
  Message as GraphQLMessage
} from './graphql';

export class AppSyncMessageService implements MessageService {
  private subscriptions: Map<string, { unsubscribe: () => void; callback: (messages: Message[]) => void }> = new Map();

  async listMessages(
    groupId: string,
    limit: number = 30,
    nextToken?: string
  ): Promise<MessageListResult> {
    try {
      const { data, error } = await apolloClient.query<{ 
        listMessages: { 
          items: any[];
          nextToken?: string;
        } 
      }>({
        query: LIST_MESSAGES,
        variables: { groupId, limit, nextToken },
        fetchPolicy: 'network-only',
      });

      if (error) {
        console.error('GraphQL error in listMessages:', error);
        throw error;
      }

      if (!data?.listMessages?.items) {
        return { messages: [], nextToken: undefined, hasMore: false };
      }

      // Messages come from DynamoDB in reverse chronological order (newest first)
      // because scanIndexForward: false in the resolver
      const messages = data.listMessages.items.map((msg: GraphQLMessage) => ({
        id: msg.messageId,
        groupId: msg.groupId,
        senderId: msg.senderId,
        senderDisplayName: msg.senderDisplayName,
        text: msg.text || null,
        attachments: msg.attachments || null,
        createdAt: msg.createdAt,
        status: 'sent' as const,
      }));

      // Keep reverse chronological order (newest first) for pagination
      // Frontend will reverse this for display (oldest first)
      return {
        messages,
        nextToken: data.listMessages.nextToken,
        hasMore: !!data.listMessages.nextToken,
      };
    } catch (error) {
      console.error('Error in listMessages:', error);
      throw error;
    }
  }

  async sendMessage(
    groupId: string,
    text: string | null,
    _senderId: string,
    _senderDisplayName: string,
    attachments?: import('../../models/Message').Attachment[]
  ): Promise<Message> {
    try {
      console.log('Sending message:', {
        groupId,
        text: text != null ? text.substring(0, 50) : '(no text)',
        attachmentsCount: attachments?.length ?? 0,
      });

      const { data, error, errors } = await apolloClient.mutate<{ sendMessage: any }>({
        mutation: SEND_MESSAGE,
        variables: {
          groupId,
          text: text ?? null,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
        },
        errorPolicy: 'all',
      });

      if (error) {
        console.error('GraphQL error in sendMessage:', error);
        throw error;
      }

      if (errors && errors.length > 0) {
        console.error('GraphQL errors in sendMessage:', errors);
        throw new Error(errors.map(e => e.message).join(', '));
      }

      if (!data?.sendMessage) {
        console.error('No data returned from sendMessage mutation');
        throw new Error('Failed to send message: No data returned');
      }

      const sentMessage = data.sendMessage;
      console.log('Message sent successfully:', sentMessage.messageId);
      
      return {
        id: sentMessage.messageId,
        groupId: sentMessage.groupId,
        senderId: sentMessage.senderId,
        senderDisplayName: sentMessage.senderDisplayName,
        text: sentMessage.text || null,
        attachments: sentMessage.attachments || null,
        createdAt: sentMessage.createdAt,
        status: 'sent' as const,
      };
    } catch (error: any) {
      console.error('Error in sendMessage:', error);
      console.error('Error details:', {
        message: error?.message,
        graphQLErrors: error?.graphQLErrors,
        networkError: error?.networkError,
      });
      
      // Enhance network errors with user-friendly messages
      if (error?.networkError || error?.message?.includes('Failed to fetch') || error?.name === 'TypeError') {
        const networkError = new Error('No internet connection. Please check your network and try again.');
        networkError.name = 'NetworkError';
        throw networkError;
      }
      
      throw error;
    }
  }

  subscribeToMessages(groupId: string, callback: (messages: Message[]) => void): () => void {
    // Clean up existing subscription for this group
    this.unsubscribeFromMessages(groupId);

    // Initialize lastMessageTime by fetching existing messages first
    // This ensures we don't miss messages or get duplicates
    let lastMessageTime = Date.now();
    let subscriptionActive = false;
    let pollingInterval: NodeJS.Timeout | null = null;
    let initializationComplete = false;
    
    // Get the latest message time from existing messages to avoid duplicates
    // This MUST complete before polling starts to ensure consistent behavior
    const initializeLastMessageTime = async () => {
      try {
        const result = await this.listMessages(groupId, 10);
        if (result.messages.length > 0) {
          const latestTime = Math.max(...result.messages.map(m => new Date(m.createdAt).getTime()));
          lastMessageTime = latestTime;
          console.log('Initialized lastMessageTime from existing messages:', new Date(lastMessageTime).toISOString());
        } else {
          console.log('No existing messages, using current time as lastMessageTime');
        }
      } catch (err) {
        console.error('Failed to initialize lastMessageTime:', err);
        // Continue with Date.now() as fallback
      } finally {
        initializationComplete = true;
      }
    };
    
    // Start initialization immediately
    initializeLastMessageTime();

    // Try WebSocket subscription first
    console.log('Setting up subscription for group:', groupId);
    let subscription: any;
    
    try {
      subscription = apolloClient.subscribe<{ onMessageSent: any }>({
        query: ON_MESSAGE_SENT,
        variables: { groupId },
      }).subscribe({
        next: ({ data, errors }) => {
          if (errors) {
            console.error('Subscription GraphQL errors:', errors);
            if (!subscriptionActive) {
              startPolling();
            }
            return;
          }
          
          if (data?.onMessageSent) {
            subscriptionActive = true; // Mark subscription as working
            console.log('✅ Received message via subscription:', data.onMessageSent.messageId);
            const newMessage: Message = {
              id: data.onMessageSent.messageId,
              groupId: data.onMessageSent.groupId,
              senderId: data.onMessageSent.senderId,
              senderDisplayName: data.onMessageSent.senderDisplayName,
              text: data.onMessageSent.text || null,
              attachments: data.onMessageSent.attachments || null,
              createdAt: data.onMessageSent.createdAt,
              status: 'sent' as const,
            };

            // Use the message's actual timestamp, not Date.now(), for consistency with polling
            const messageTime = new Date(newMessage.createdAt).getTime();
            lastMessageTime = Math.max(lastMessageTime, messageTime);
            callback([newMessage]);
          }
        },
        error: (error) => {
          console.error('❌ Subscription error:', error);
          console.log('⚠️ Falling back to polling for real-time updates');
          // Start polling as fallback
          startPolling();
        },
        complete: () => {
          console.log('Subscription completed/closed');
          if (!subscriptionActive) {
            startPolling();
          }
        },
      });
      
      console.log('Subscription created, waiting for connection...');
    } catch (error) {
      console.error('Failed to create subscription:', error);
      console.log('Starting polling immediately');
      startPolling();
      // Create a dummy subscription object for cleanup
      subscription = { unsubscribe: () => {} };
    }

    // Polling fallback (checks for new messages every 2 seconds)
    const startPolling = () => {
      if (pollingInterval) {
        console.log('Polling already active');
        return; // Already polling
      }
      
      console.log('🔄 Starting polling fallback for group:', groupId);
      pollingInterval = setInterval(async () => {
        // Wait for initialization to complete before polling
        if (!initializationComplete) {
          console.log('Waiting for initialization to complete before polling...');
          return;
        }
        
        try {
          // Only fetch the latest messages (limit: 10) to check for new ones
          const result = await this.listMessages(groupId, 10);
          // Find messages newer than lastMessageTime
          const newMessages = result.messages.filter(msg => {
            const msgTime = new Date(msg.createdAt).getTime();
            return msgTime > lastMessageTime;
          });
          
          if (newMessages.length > 0) {
            console.log(`📨 Polling found ${newMessages.length} new message(s)`);
            // Use Math.max to ensure we track the latest message timestamp consistently
            lastMessageTime = Math.max(lastMessageTime, ...newMessages.map(m => new Date(m.createdAt).getTime()));
            callback(newMessages);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 2000); // Poll every 2 seconds
    };

    // Start polling after 5 seconds if subscription hasn't received any messages
    // Note: Polling will wait for initialization to complete before actually polling
    const pollingTimeout = setTimeout(() => {
      if (!subscriptionActive) {
        console.log('WebSocket subscription not receiving messages, starting polling fallback');
        startPolling();
      }
    }, 5000);

    const unsubscribe = () => {
      subscription.unsubscribe();
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      clearTimeout(pollingTimeout);
      this.subscriptions.delete(groupId);
    };

    this.subscriptions.set(groupId, { unsubscribe, callback });

    return unsubscribe;
  }

  private unsubscribeFromMessages(groupId: string): void {
    const subscription = this.subscriptions.get(groupId);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(groupId);
    }
  }
}