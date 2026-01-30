import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuthStore } from '../store/useAuthStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../models/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Tabs'>;

export default function LogoutScreen({ navigation }: Props) {
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            navigation.replace('Login');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Logout Screen</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, marginBottom: 20 },
  button: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    width: 150,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '600' }
});
