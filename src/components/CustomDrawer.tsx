import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuthStore } from '../store/useAuthStore';

export default function CustomDrawer(props: any) {
  const { user, logout } = useAuthStore();

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props}>
        {/* Profile Header */}
        <View style={styles.profileBox}>
          <Text style={styles.name}>{user?.displayName}</Text>
          <Text style={styles.userId}>{user?.userId}</Text>
        </View>

        {/* Menu Items */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Chat')}
        >
          <Text>Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => props.navigation.navigate('Profile')}
        >
          <Text>Profile</Text>
        </TouchableOpacity>
      </DrawerContentScrollView>

      {/* Logout at Bottom */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  profileBox: {
    padding: 20,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb'
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  userId: {
    color: '#6b7280',
    marginTop: 4
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6'
  },
  logoutButton: {
    padding: 18,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fee2e2'
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: 'bold',
    textAlign: 'center'
  }
});
