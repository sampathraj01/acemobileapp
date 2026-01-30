import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons'; 

// Your stores & services (adjust paths)
import { useAuthStore } from '../store/useAuthStore';
import { AdminService, AdminGroup, AdminGroupMember } from '../services/aws/AdminService';
import { LIST_GROUP_MEMBERS } from '../services/aws/graphql';
import { apolloClient } from '../services/aws/apollo-client';

const adminService = new AdminService();

export default function GroupsAdminScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [creating, setCreating] = useState(false);

  const isAdmin = user?.isGlobalAdmin ?? false;
  console.log("useruseruser",user)

  // Load all groups
  const loadGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allGroups = await adminService.listAllGroups();
      setGroups(allGroups);
    } catch (e: any) {
      setError(e.message || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadGroups();
    }
  }, [isAdmin, loadGroups]);

  // Load members when group is selected
   useEffect(() => {
    if (!selectedGroupId) {
      setMembers([]);
      return;
    }
    apolloClient
      .query<{ listGroupMembers: AdminGroupMember[] }>({ query: LIST_GROUP_MEMBERS, variables: { groupId: selectedGroupId }, fetchPolicy: 'network-only' })
      .then((res) => setMembers(res.data?.listGroupMembers ?? []))
      .catch(() => setMembers([]));
  }, [selectedGroupId]);

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const newGroup = await adminService.adminCreateGroup(name);
      setGroups((prev) => [...prev, newGroup]);
      setNewGroupName('');
      Alert.alert('Success', `Group "${name}" created`);
    } catch (e: any) {
      setError(e.message || 'Failed to create group');
      Alert.alert('Error', e.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  // If not admin → redirect / show message
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Access denied: Admin only</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadGroups}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const selectedGroupName =
    groups.find((g) => g.groupId === selectedGroupId)?.groupName || selectedGroupId || '';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
          <Icon name="arrow-back" size={24} color="#2563eb" />
        </TouchableOpacity>
        <Text style={styles.title}>Groups Admin</Text>
      </View>

      {/* Create Group */}
      <View style={styles.createSection}>
        <TextInput
          style={styles.input}
          value={newGroupName}
          onChangeText={setNewGroupName}
          placeholder="New group name"
          placeholderTextColor="#9ca3af"
        />
        <TouchableOpacity
          style={[
            styles.createButton,
            (creating || !newGroupName.trim()) && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={creating || !newGroupName.trim()}
        >
          {creating ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.createButtonText}>Create</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Groups List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>All Groups</Text>
          <FlatList
            data={groups}
            keyExtractor={(item) => item.groupId}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.groupItem,
                  selectedGroupId === item.groupId && styles.groupItemSelected,
                ]}
                onPress={() => setSelectedGroupId(item.groupId)}
              >
                <Text style={styles.groupName}>{item.groupName}</Text>
                <Text style={styles.groupId}>ID: {item.groupId}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No groups found</Text>
            }
          />
        </View>

        {/* Members List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>
            {selectedGroupId
              ? `Members of ${selectedGroupName}`
              : 'Select a group to view members'}
          </Text>

          {selectedGroupId ? (
            <FlatList
              data={members}
              keyExtractor={(item) => `${item.groupId}-${item.userId}`}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  <Text style={styles.memberId}>{item.userId}</Text>
                  <Text style={styles.memberRole}>{item.role}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No members in this group</Text>
              }
            />
          ) : (
            <Text style={styles.selectPrompt}>Select a group from the top</Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backIcon: {
    marginRight: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  createSection: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'column', // on mobile we stack vertically
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  groupItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  groupItemSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  groupName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  groupId: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  memberId: {
    fontSize: 15,
    color: '#111827',
  },
  memberRole: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  emptyText: {
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 16,
    marginTop: 20,
  },
  selectPrompt: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
  },
  errorText: {
    fontSize: 18,
    color: '#dc2626',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  backButton: {
    marginTop: 20,
    padding: 12,
  },
  backButtonText: {
    color: '#2563eb',
    fontSize: 16,
    fontWeight: '500',
  },
});