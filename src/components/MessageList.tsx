import React, { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useChatStore } from '../store/useChatStore';
import { MessageBubble } from './MessageBubble';
import { Message } from '../models/Message';

// Date header formatting
const formatDateHeader = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);
  messageDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);

  if (messageDate.getTime() === today.getTime()) return 'Today';
  if (messageDate.getTime() === yesterday.getTime()) return 'Yesterday';

  return messageDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

type MessageGroup = { date: string; messages: Message[] };

const groupMessagesByDate = (messages: Message[]): MessageGroup[] => {
  if (!messages?.length) return [];

  const groups: MessageGroup[] = [];
  let currentGroup: Message[] = [];
  let currentDate: string | null = null;

  messages.forEach((message, index) => {
    const dateHeader = formatDateHeader(new Date(message.createdAt));

    if (currentDate !== dateHeader) {
      if (currentGroup.length > 0 && currentDate) {
        groups.push({ date: currentDate, messages: currentGroup });
      }
      currentGroup = [message];
      currentDate = dateHeader;
    } else {
      currentGroup.push(message);
    }

    if (index === messages.length - 1 && currentDate) {
      groups.push({ date: currentDate, messages: currentGroup });
    }
  });

  return groups;
};

export const MessageList = () => {
  const {
    messages,
    isLoadingMore,
    hasMoreMessages,
    loadMoreMessages,
  } = useChatStore();

  const flatListRef = useRef<FlatList>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Prevent multiple simultaneous load requests
  const loadingInProgress = useRef(false);

  const listData = useMemo(() => {
    // Your original logic: reverse because store likely has newest first
    const sortedForDisplay = [...messages].reverse();

    const result: Array<{ type: 'header'; date: string } | Message> = [];

    const groups = groupMessagesByDate(sortedForDisplay);

    groups.forEach((group) => {
      group.messages.forEach((msg) => result.push(msg));
      result.push({ type: 'header', date: group.date });
    });

    return result;
  }, [messages]);

  const renderItem = ({ item }: { item: { type: 'header'; date: string } | Message }) => {
    if ('type' in item && item.type === 'header') {
      return (
        <View style={styles.dateHeaderContainer}>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
        </View>
      );
    }

    return <MessageBubble message={item as Message} />;
  };

  const keyExtractor = (item: any, index: number) => {
    if ('type' in item && item.type === 'header') {
      return `header-${item.date}-${index}`;
    }
    return (item as Message).id || `msg-${index}`;
  };

  useEffect(() => {
    if (shouldAutoScroll && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages.length, shouldAutoScroll]);

  const onScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - contentOffset.y - layoutMeasurement.height;
    setShouldAutoScroll(distanceFromBottom < 180);
  };

  const handleLoadMore = useCallback(() => {
    if (
      !hasMoreMessages ||
      isLoadingMore ||
      loadingInProgress.current
    ) {
      return;
    }

    loadingInProgress.current = true;

    loadMoreMessages().finally(() => {
      loadingInProgress.current = false;
    });
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  if (!messages?.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No messages yet</Text>
        <Text style={styles.emptySubtitle}>Start the conversation!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={listData}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        inverted={true}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.25}           // Earlier trigger → smoother feel
        onScroll={onScroll}
        scrollEventThrottle={16}
        initialNumToRender={20}
        maxToRenderPerBatch={15}
        windowSize={21}
        // ────── Key for smooth pagination in inverted list ──────
        maintainVisibleContentPosition={{
          minIndexForVisible: 1,
          autoscrollToTopThreshold: 30,        // adjust 10–50 based on your testing
        }}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#666" />
              <Text style={styles.loadingText}>Loading older messages...</Text>
            </View>
          ) : null
        }
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingBottom: 16,
    paddingTop: 16,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateBadge: {
    backgroundColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  dateText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500',
  },
  loadingContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    color: '#4b5563',
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
});