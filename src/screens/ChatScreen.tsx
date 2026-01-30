import React, { useEffect } from 'react';
import { View, StyleSheet, Text, FlatList, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import type { Group } from '../models/Group';
import { ProjectHeader } from '../components/ProjectHeader';

export default function Chat() {

  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { loadGroups, setCurrentGroup, groups } = useChatStore();

  useEffect(() => {
    if (user?.userId) {
      loadGroups();
    }
  }, [user?.userId]);

  const renderGroup = ({ item }: { item: Group }) => {
    return (
      <TouchableOpacity 
        style={styles.groupCard}
        onPress={() => {
          setCurrentGroup(item.id);
          navigation.navigate('GroupChat' as never);
        }}>
        <Text style={styles.groupName}>{item.name}</Text>
        <Text style={styles.memberCount}>
          {item.memberIds?.length || 0} Members
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ProjectHeader />
      <FlatList<Group>
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={renderGroup}
        ListEmptyComponent={<Text>No groups found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  groupCard: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
  },
  activeGroup: {
    borderWidth: 2,
    borderColor: '#4f46e5',
    backgroundColor: '#eef2ff',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 13,
    color: '#555',
    marginTop: 4,
  },
});
