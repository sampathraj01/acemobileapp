import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; // ← Added import
import { useChatStore } from '../store/useChatStore';

export function GroupChatHeader() {
  const navigation = useNavigation();
  const { groups, currentGroupId } = useChatStore();

  const currentGroup = groups.find((g) => g.id === currentGroupId);

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        onPress={() => navigation.goBack()}
        style={styles.backButton}
      >
        <Icon name="arrow-back" size={24} color="#2563eb" />
      </TouchableOpacity>

      {/* Group Info */}
      <View style={styles.groupInfo}>
        <Text style={styles.groupName}>
          {currentGroup?.name || 'Group'}
        </Text>

        <Text style={styles.memberCount}>
          {currentGroup?.memberIds?.length || 0} members
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  backButton: {
    padding: 8,           
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  memberCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});