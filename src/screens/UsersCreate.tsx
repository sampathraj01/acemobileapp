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
  Switch,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

// Your stores & services (adjust paths as needed)
import { useAuthStore } from '../store/useAuthStore';
import { AdminService, AdminUserProfile, AdminGroup } from '../services/aws/AdminService';

const adminService = new AdminService();

export default function UsersAdminScreen() {
  const navigation = useNavigation();
  const { user } = useAuthStore();

  const [users, setUsers] = useState<AdminUserProfile[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create user form
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Assign groups modal
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null);
  const [assigningGroupIds, setAssigningGroupIds] = useState<string[]>([]);
  const [assigningLoading, setAssigningLoading] = useState(false);
  const [assigningSaving, setAssigningSaving] = useState(false);

  // ─── Validation states ─────────────────────────────────────────────
  const [emailError, setEmailError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);

  const isAdmin = user?.isGlobalAdmin ?? false;

  // Simple email validation
  const isValidEmail = (em: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(em);
  };

  // Validate email
  const validateEmail = useCallback((value: string) => {
    if (!value.trim()) {
      setEmailError('Email is required');
    } else if (!isValidEmail(value)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError(null);
    }
  }, []);

  // Validate display name (optional, but min length if provided)
  const validateDisplayName = useCallback((value: string) => {
    if (value.trim() && value.trim().length < 2) {
      setDisplayNameError('Display name must be at least 2 characters');
    } else {
      setDisplayNameError(null);
    }
  }, []);

  // Load users & groups
  useEffect(() => {
    if (!isAdmin) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [u, g] = await Promise.all([
          adminService.listAllUsers(),
          adminService.listAllGroups(),
        ]);
        setUsers(u);
        setGroups(g);

        const ace = g.find((x) => x.groupName === 'Ace' || x.groupId.includes('ace'));
        if (ace) {
          setSelectedGroupIds((prev) => (prev.length ? prev : [ace.groupId]));
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAdmin]);

  // Load current groups when assigning starts
  useEffect(() => {
    if (!assigningUserId) return;

    const fetchUserGroups = async () => {
      setAssigningLoading(true);
      try {
        const memberships = await adminService.getUserGroupMemberships(assigningUserId);
        setAssigningGroupIds(memberships.map((m) => m.groupId));
      } catch (e: any) {
        setError(e.message || 'Failed to load user groups');
      } finally {
        setAssigningLoading(false);
      }
    };

    fetchUserGroups();
  }, [assigningUserId]);

  const toggleGroupForCreate = (groupId: string) => {
    setSelectedGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleGroupForAssign = (groupId: string) => {
    setAssigningGroupIds((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  };

  const handleCreateUser = async () => {
    // Re-validate before submission
    validateEmail(email);
    validateDisplayName(displayName);

    if (emailError || displayNameError || !email.trim() || !isValidEmail(email)) {
      Alert.alert('Validation Error', 'Please fix the errors in the form');
      return;
    }

    const em = email.trim();
    const name = displayName.trim() || em;

    setCreating(true);
    setError(null);

    try {
      const newUser = await adminService.adminCreateUser(em, name, isGlobalAdmin);

      if (selectedGroupIds.length > 0) {
        await adminService.adminSetUserGroups(newUser.userId, selectedGroupIds, 'MEMBER');
      }

      setUsers((prev) => [newUser, ...prev]);
      setEmail('');
      setDisplayName('');
      setIsGlobalAdmin(false);
      setSelectedGroupIds([]);
      setEmailError(null);
      setDisplayNameError(null);

      Alert.alert('Success', `User ${newUser.displayName} (${newUser.userId}) created`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create user');
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveAssignGroups = async () => {
    if (!assigningUserId) return;

    setAssigningSaving(true);
    setError(null);

    try {
      await adminService.adminSetUserGroups(assigningUserId, assigningGroupIds, 'MEMBER');

      const targetUser = users.find((u) => u.userId === assigningUserId);
      Alert.alert(
        'Success',
        `Groups updated for ${targetUser?.displayName ?? assigningUserId}`
      );

      setTimeout(() => {
        setAssigningUserId(null);
      }, 1500);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update groups');
      setError(e.message);
    } finally {
      setAssigningSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Access denied: Admin only</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
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
          <Text style={styles.loadingText}>Loading users and groups...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backIcon}>
              <Icon name="arrow-back" size={28} color="#2563eb" />
            </TouchableOpacity>
            <Text style={styles.title}>Users Admin</Text>
          </View>

          {/* Create User Form */}
          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Create New User</Text>

            {/* Email */}
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                validateEmail(text);
              }}
              placeholder="email@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError && <Text style={styles.errorMessage}>{emailError}</Text>}

            {/* Display Name */}
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={[styles.input, displayNameError && styles.inputError]}
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                validateDisplayName(text);
              }}
              placeholder="Display name"
            />
            {displayNameError && <Text style={styles.errorMessage}>{displayNameError}</Text>}

            {/* Global Admin */}
            <View style={styles.switchRow}>
              <Text style={styles.label}>Global Admin</Text>
              <Switch
                value={isGlobalAdmin}
                onValueChange={setIsGlobalAdmin}
                trackColor={{ false: '#767577', true: '#2563eb' }}
              />
            </View>

            {/* Assign to Groups */}
            <Text style={styles.label}>Assign to Groups</Text>
            <View style={styles.groupsGrid}>
              {groups.map((g) => (
                <TouchableOpacity
                  key={g.groupId}
                  style={styles.groupCheckboxRow}
                  onPress={() => toggleGroupForCreate(g.groupId)}
                >
                  <View style={styles.checkbox}>
                    {selectedGroupIds.includes(g.groupId) && <View style={styles.checkboxFilled} />}
                  </View>
                  <Text style={styles.groupNameText}>{g.groupName}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[
                styles.createButton,
                (creating || !!emailError || !!displayNameError || !email.trim()) && styles.buttonDisabled,
              ]}
              onPress={handleCreateUser}
              disabled={creating || !!emailError || !!displayNameError || !email.trim()}
            >
              {creating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create User</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Users List */}
          <Text style={styles.sectionTitle}>All Users</Text>

          <FlatList
            data={users}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.userRow}>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{item.displayName}</Text>
                  <Text style={styles.userId}>{item.userId}</Text>
                  {item.isGlobalAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>Admin</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.assignButton}
                  onPress={() => setAssigningUserId(item.userId)}
                >
                  <Text style={styles.assignButtonText}>Assign Groups</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Assign Groups Modal */}
      <Modal
        visible={!!assigningUserId}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAssigningUserId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Assign Groups for{' '}
              {users.find((u) => u.userId === assigningUserId)?.displayName ?? assigningUserId}
            </Text>

            {assigningLoading ? (
              <ActivityIndicator size="large" color="#2563eb" style={{ margin: 40 }} />
            ) : (
              <>
                <ScrollView style={{ maxHeight: 400 }}>
                  {groups.map((g) => (
                    <TouchableOpacity
                      key={g.groupId}
                      style={styles.modalCheckboxRow}
                      onPress={() => toggleGroupForAssign(g.groupId)}
                    >
                      <View style={styles.checkbox}>
                        {assigningGroupIds.includes(g.groupId) && (
                          <View style={styles.checkboxFilled} />
                        )}
                      </View>
                      <Text style={styles.groupNameText}>{g.groupName}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setAssigningUserId(null)}
                    disabled={assigningSaving}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton, assigningSaving && styles.buttonDisabled]}
                    onPress={handleSaveAssignGroups}
                    disabled={assigningSaving}
                  >
                    {assigningSaving ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backIcon: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  errorMessage: {
    color: '#dc2626',
    fontSize: 13,
    marginTop: 4,
    marginLeft: 4,
    marginBottom: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupsGrid: { marginBottom: 16 },
  groupCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxFilled: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  groupNameText: { fontSize: 15, color: '#111827' },
  createButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  userRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '500', color: '#111827' },
  userId: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  adminBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  adminBadgeText: { fontSize: 12, color: '#92400e', fontWeight: '600' },
  assignButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: { color: '#2563eb', fontWeight: '500', fontSize: 14 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 16, marginTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 16, fontSize: 16, color: '#4b5563' },
  errorText: { fontSize: 18, color: '#dc2626', textAlign: 'center', marginBottom: 20 },
  backButton: { marginTop: 20, padding: 12 },
  backButtonText: { color: '#2563eb', fontSize: 16, fontWeight: '500' },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  modalCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: { backgroundColor: '#e5e7eb' },
  cancelButtonText: { color: '#374151', fontWeight: '600', fontSize: 16 },
  saveButton: { backgroundColor: '#2563eb' },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});